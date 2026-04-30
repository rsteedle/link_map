#### 
# Data prep for Link Light rail map
####

library(tidyverse)
library(sf)

# Set directories
proj_dir <- here::here()

###
# Census data median income layer
###

# Load census data - median income by census tract in select counties Washington state for 2010, 2015, 2020

# 2010 data
raw_2010 <- read.csv(file.path(proj_dir, "data/acs_2010.csv"))

acs_2010 <- raw_2010 %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         year = 2010) %>%
  filter(!is.na(med_income))

# 2015
raw_2015 <- read.csv(file.path(proj_dir, "data/acs_2015.csv"))

acs_2015 <- raw_2015 %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         year = 2015) %>%
  filter(!is.na(med_income))

# 2020
raw_2020 <- read.csv(file.path(proj_dir, "data/acs_2020.csv"))

acs_2020 <- raw_2020 %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         year = 2020) %>%
  filter(!is.na(med_income))

# Combine years
acs_income <- bind_rows(acs_2010, acs_2015, acs_2020)

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
# Split Link station and line data into separate files
###
stations_lines <- read_sf(file.path(proj_dir, "data/stations_lines.geojson"))

stations <- stations_lines %>% filter(!is.na(station))
st_write(stations, file.path(proj_dir, "data/link_stations.geojson"), driver = "GeoJSON", delete_dsn = TRUE)

lines <- stations_lines %>% filter(!is.na(line_number))
st_write(lines, file.path(proj_dir, "data/link_lines.geojson"), driver = "GeoJSON", delete_dsn = TRUE)


###
# Calculate average income by year
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
  st_transform(2927)

stations <- stations %>%
  mutate(open_2009 = ifelse(open_year<=2009,1,0),
         open_2016 = ifelse(open_year<=2016,1,0), 
         open_2021 = ifelse(open_year<=2021,1,0), 
         open_2024 = ifelse(open_year<=2024,1,0), 
         open_2025 = ifelse(open_year<=2025,1,0), 
         open_2026 = ifelse(open_year<=2026,1,0))

# Create "treated" buffer zones and identify tracts within buffer zones for each expansion year 
expansion_years <- unique(stations$open_year)

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
  
  colnames(tracts_ft) <- str_replace_all(colnames(tracts_ft), "treat_id", paste0("treated_", y))
  
}






