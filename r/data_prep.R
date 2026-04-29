#### 
# Data prep for Link Light rail map
####

library(tidyverse)

# Set directories
proj_dir <- "/Users/rubysteedle/documents/github/link_map/"


# Load census data - median income by census tract in select counties Washington state for 2010, 2015, 2020

# Relevant counties
counties <- "Snohomish|King|Pierce"

# 2010 data
raw_2010 <- read.csv(paste0(proj_dir, "data/acs_2010.csv"))

acs_2010 <- raw_2010 %>%
  filter(grepl(counties, NAME)) %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         year = 2010) %>%
  filter(!is.na(med_income))

# 2015
raw_2015 <- read.csv(paste0(proj_dir, "data/acs_2015.csv"))

acs_2015 <- raw_2015 %>%
  filter(grepl(counties, NAME)) %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         year = 2015) %>%
  filter(!is.na(med_income))

# 2020
raw_2020 <- read.csv(paste0(proj_dir, "data/acs_2020.csv"))

acs_2020 <- raw_2020 %>%
  filter(grepl(counties, NAME)) %>%
  rename(geo_id = GEO_ID,
         med_income = S1903_C02_001E) %>%
  select(geo_id, med_income) %>%
  mutate(med_income = as.numeric(med_income),
         year = 2020) %>%
  filter(!is.na(med_income))

# Combine years
acs_income <- bind_rows(acs_2010, acs_2015, acs_2020)

# Save merged data
write.csv(acs_income, file = paste0(proj_dir, "data/acs_med_income.csv"))