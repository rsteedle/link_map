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
         med_income_2010 = S1903_C02_001E) %>%
  select(geo_id, med_income_2010) %>%
  mutate(med_income_2010 = as.numeric(med_income_2010)) %>%
  filter(!is.na(med_income_2010))

acs_income <- acs_2010

# Loop through rest of census years
census_years <- 2011:2024
  
for (y in census_years) {
  raw_acs <- read.csv(paste0(proj_dir, "/data/acs_data/ACSST5Y", y, ".S1903-Data.csv"))
  
  if (y<=2016){
    raw_acs <- raw_acs %>%
      rename(geo_id = GEO_ID,
             med_income = S1903_C02_001E) %>% # name of median income column changes from 2016 to 2017
      select(geo_id, med_income)  
  
    
  }else{
    raw_acs <- raw_acs %>%
      rename(geo_id = GEO_ID,
             med_income = S1903_C03_001E) %>%
      select(geo_id, med_income)
  }
  
  acs_year_data <- raw_acs %>%
    mutate(med_income = ifelse(med_income=="250,000+", "250000", med_income)) %>%
    mutate(med_income = as.numeric(med_income)) %>%
    filter(!is.na(med_income)) %>%
    select(geo_id, med_income)
  
  colnames(acs_year_data) <- c("geo_id", paste0("med_income_", y))
  
  acs_income <- full_join(acs_income, acs_year_data, by = "geo_id")
}

# Save merged data
write.csv(acs_income, file = file.path(proj_dir, "data/acs_med_income.csv"))

###
# Merge income data with census tract geojson
###
acs_income <- read.csv(file.path(proj_dir, "data/acs_med_income.csv")) %>%
  select(-X)

census_tracts_raw_2010 <- read_sf(file.path(proj_dir, "data/tract10_minified.json"))
census_tracts_raw_2020 <- read_sf(file.path(proj_dir, "data/tract20_minified.json"))

# Set correct CRS
st_crs(census_tracts_raw_2010) <- 2927
st_crs(census_tracts_raw_2020) <- 2927

# Transform to WGS84
census_tracts_2010 <- st_transform(census_tracts_raw_2010, 4326)
census_tracts_2020 <- st_transform(census_tracts_raw_2020, 4326)

census_tracts_2010 <- census_tracts_2010 %>%
  rename(geo_id = GEOID10) %>%
  select(geo_id, geometry)

census_tracts_2020 <- census_tracts_2020 %>%
  rename(geo_id = GEOID20) %>%
  select(geo_id, geometry)

acs_income_2010 <- acs_income %>%
  mutate(geo_id = str_remove(geo_id, "1400000US")) %>%
  select(-contains("202")) %>%
  mutate(tract_year = 2010)

acs_income_2020 <- acs_income %>%
  mutate(geo_id = str_remove(geo_id, "1400000US")) %>%
  select(-contains("201")) %>%
  mutate(tract_year = 2020)

tracts_income_2010 <- inner_join(acs_income_2010, census_tracts_2010, by = "geo_id", multiple = "all")
tracts_income_2020 <- inner_join(acs_income_2020, census_tracts_2020, by = "geo_id", multiple = "all")

tracts_income <- bind_rows(tracts_income_2010, tracts_income_2020)

income_sf <- st_sf(tracts_income)

# 
# check <- full_join(acs_income_2020, census_tracts_2020, by = "geo_id", multiple = "all") 
# 
# acs_tracts <- unique(acs_income_2020$geo_id)
# geo_tracts <- unique(census_tracts_2020$geo_id)
# 
# check <- check %>%
#   filter(! geo_id %in% acs_tracts)

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

station_names <- stations$station

for (y in expansion_years) {

  stations_buffer <- stations_ft %>%
    filter(open_year<=y) %>%
    st_buffer(dist = 2640)
  
  tracts_ft$new_treated = ifelse(st_intersects(tracts_ft, stations_buffer, sparse = F), 1, 0)
  
  tracts_ft <- tracts_ft %>%
    rowwise() %>%
    mutate(treated_sum = sum(across(starts_with("new_treated"))),
           treat_id = ifelse(treated_sum>0,1,0))
    
  ## TODO: add names of nearby stations
  # station_inds <- tracts_ft %>% 
  #   st_drop_geometry() %>%
  #   select(contains("treated"), geo_id) 
  # 
  # station_inds$names <- station_names[station_inds$new_treated]
  # 
  # tracts_ft$station_inds <- unlist(tracts_ft[,])
  #   mutate(station_inds = unlist(starts_with("treated")))
  # 
  # # colnames(tracts_ft) <- str_replace_all(colnames(tracts_ft), "treat_id", paste0("treated_", y))
  
  
    tracts_ft <- tracts_ft %>%  
      mutate(treat_year = ifelse(treat_id==1, y, treat_year)) %>%
      select(-contains("treated"))
  
}

## Save tracts data with treat_year info 
tracts_treated <- tracts_ft %>%
  st_transform(4326) 

st_write(tracts_treated, file.path(proj_dir, "data/census_tracts_treated.geojson"), driver = "GeoJSON", delete_dsn = TRUE)


## 
# Calculate average median income of treated tracts by year TODO FIX THIS
##
tracts_treated <- st_read(file.path(proj_dir, "data/census_tracts_treated.geojson"))

years <- 2026:2009

exp_summ <- data.frame(year = years, med_income = NA)

for (y in years) {
  
  # only have 2010-2024 census data, so using 2010 data for 2009 and 2024 data for 2025, 2026
  census_year <- ifelse(y>2024, 2024, y)
  census_year <- ifelse(y<2010, 2010, census_year)
  
  subset <- tracts_treated %>%
    st_drop_geometry() %>%
    filter(treat_year <= y) %>%
    ungroup()
  
  year_avg <- mean(subset$med_income_{y})
  
    # select(geo_id, treat_year, med_income, acs_year) %>%
    # filter(treat_year<=y)  %>%
    # filter(acs_year==census_year) %>%
    # 
  
  
  summ <- subset %>%
    ungroup() %>%
    summarize(med_income = mean(med_income))
  
  exp_summ$med_income[exp_summ$year==y] <- summ[1,1]
}

exp_summ_csv <- apply(exp_summ,2,as.numeric)

write.csv(exp_summ_csv, file = file.path(proj_dir, "data/average_income.csv"))

