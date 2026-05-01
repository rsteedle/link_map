#### 
# Data prep for Link Light rail map
####

library(tidyverse)
library(sf)

# Set directories
proj_dir <- here::here()



###
# Split Link station and line data into separate files
###
stations_lines <- read_sf(file.path(proj_dir, "data/stations_lines.geojson"))

stations <- stations_lines %>% filter(!is.na(station))
st_write(stations, file.path(proj_dir, "data/link_stations.geojson"), driver = "GeoJSON", delete_dsn = TRUE)

lines <- stations_lines %>% filter(!is.na(line_number))
st_write(lines, file.path(proj_dir, "data/link_lines.geojson"), driver = "GeoJSON", delete_dsn = TRUE)



###
# Census data median income layer
###

# Load census data - median income by census tract in Washington state for 2010-2024

# Start with 2010
raw_2010 <- read.csv(file.path(proj_dir, "data/acs_data/ACSST5Y2010.S1903-Data.csv"))

acs_2010 <- raw_2010 %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         acs_year = 2010) %>%
  filter(!is.na(med_income))

acs_income <-acs_2010

# Loop through rest of census years
census_years <- 2011:2024
  
for (y in census_years) {
  raw_acs <- read.csv(paste0(proj_dir, "/data/acs_data/ACSST5Y", y, ".S1903-Data.csv"))
  
  if (y<=2016){
    raw_acs <- raw_acs %>%
      rename(geo_id = GEO_ID,
             med_income = S1903_C02_001E) # name of median income column changes from 2016 to 2017
  }else{
    raw_acs <- raw_acs %>%
      rename(geo_id = GEO_ID,
             med_income = S1903_C03_001E)
  }
  
  acs_year_data <- raw_acs %>%
    mutate(med_income = as.numeric(med_income), 
           acs_year = y) %>%
    filter(!is.na(med_income)) %>%
    select(geo_id, med_income, acs_year)
  
  acs_income <- bind_rows(acs_income, acs_year_data)
}

# Save merged data
write.csv(acs_income, file = file.path(proj_dir, "data/acs_med_income.csv"))


# Merge income data with census tract geojson
census_tracts_raw <- read_sf(file.path(proj_dir, "data/tract10.json"))

# Set correct CRS
st_crs(census_tracts_raw) <- 2927

# Transform to WGS84
census_tracts<- st_transform(census_tracts_raw, 4326)

census_tracts <- census_tracts %>%
  filter(POP10>0) %>%
  rename(geo_id = GEOID10) %>%
  select(geo_id, geometry)

acs_income <- acs_income %>%
  mutate(geo_id = str_remove(geo_id, "1400000US"))

tracts_income <- inner_join(acs_income, census_tracts, by = "geo_id", multiple = "all")

income_sf <- st_sf(tracts_income)


# Write the geojson
st_write(income_sf, file.path(proj_dir, "data/tract_income.geojson"), driver = "GeoJSON", delete_dsn = TRUE)



###
# Identify treated tracts by year, calculate average income of treated
###

# Load station location and opening dates data
stations <- read_sf(file.path(proj_dir, "data/link_stations.geojson"))

# Transform to feet map type
stations_ft <- stations %>%
  st_transform(2927)

# Load census tract data
tracts <- read_sf(file.path(proj_dir, "data/tract_income.geojson"))

# Transform to feet map type
tracts_ft <- tracts %>%
  st_transform(2927) %>%
  mutate(treat_year = NA)

# Create "treated" buffer zones and identify tracts within buffer zones for each expansion year 
expansion_years <- unique(stations$open_year)

expansion_years <- sort(expansion_years, decreasing = TRUE)

for (y in expansion_years) {

  stations_buffer <- stations_ft %>%
    filter(open_year<=y) %>%
    st_buffer(dist = 2640)
  
  tracts_ft$new_treated = ifelse(st_intersects(tracts_ft, stations_buffer, sparse = F), 1, 0)
  
  tracts_ft <- tracts_ft %>%
    rowwise() %>%
    mutate(treated_sum = sum(across(starts_with("new_treated"))),
           treat_id = ifelse(treated_sum>0,1,0)) %>%
    select(-contains("treated"))
  
  ## TODO: add names of nearby stations
    
  tracts_ft <- tracts_ft %>%  
    mutate(treat_year = ifelse(treat_id==1, y, treat_year))
  
  # colnames(tracts_ft) <- str_replace_all(colnames(tracts_ft), "treat_id", paste0("treated_", y))
  
}

## Save tracts data with treat_year info 
tracts_treated <- tracts_ft %>%
  st_transform(4326) 

st_write(tracts_treated, file.path(proj_dir, "data/census_tracts_treated.geojson"), driver = "GeoJSON", delete_dsn = TRUE)


## 
# Calculate average median income of treated tracts by year
##
tracts_treated <- st_read(file.path(proj_dir, "data/census_tracts_treated.geojson"))

years <- 2026:2009

exp_summ <- data.frame(year = years, med_income = NA)

for (y in years) {
  
  # only have 2010-2024 census data, so using 2010 data for 2009 and 2024 data for 2025, 2026
  census_year <- ifelse(y>2024, 2024, y)
  census_year <- ifelse(y<2010, 2010, census_year)
  
  subset <- tracts_treated %>%
    select(geo_id, treat_year, med_income, acs_year) %>%
    filter(treat_year<=y)  %>%
    filter(acs_year==census_year) %>%
    st_drop_geometry()
  
  
  summ <- subset %>%
    ungroup() %>%
    summarize(med_income = mean(med_income))
  
  exp_summ$med_income[exp_summ$year==y] <- summ[1,1]
}

exp_summ_csv <- apply(exp_summ,2,as.numeric)

write.csv(exp_summ_csv, file = file.path(proj_dir, "data/average_income.csv"))

