// set mapbox access token   
mapboxgl.accessToken = 'pk.eyJ1IjoicnVieXN0ZWVkbGUiLCJhIjoiY21uaTJ1YnBkMDk0NDJxb29qaG5hNXl3eSJ9.6yIA6pZliTXFh_X7iZHfig';

////////
// CREATE MAP
////////

// declare map options
const mapOptions = {
    zoom: 10, 
    maxZoom: 11,
    minZoom: 8,
    center: [-122.36935, 47.60774], // set default center to downtown Seattle
    maxBounds: [[ -124, 47],[-121, 49]],
    container: 'map-container',
    style: 'mapbox://styles/mapbox/standard',
    terrain: null,
    config: {
        basemap: {
        lightPreset: "dawn",
        showPedestrianRoads: false,
        showPlaceLabels: false,
        showPointOfInterestLabels: false,
        showRoadLabels: false,
        showTransitLabels: false,
        show3dBuildings: false,
        show3dTrees: false,
        show3dLandmarks: false,
        theme: "monochrome"
        }
    },
};


const map = new mapboxgl.Map(mapOptions);


map.on('load', () => {

// Set default year for data
const default_year = 2009;
const default_census_year = 2014;

// Add station markers layer

map.addSource('link_stations', {
        type: 'geojson',
        data: './data/link_stations.geojson'
})

map.addLayer({
        id: 'station_markers',
        type: 'circle',
        source: 'link_stations',
        layout: {
            'visibility': 'visible'
        },
        paint: {
            'circle-radius': 5,
            'circle-color': '#bbad17',
            'circle-opacity': 0.8
        }
    });


map.setFilter('station_markers', ['<=', ['number', ['get', 'open_year']], default_year]);

// Add Link lines layer

map.addSource('link_routes', {
        type: 'geojson',
        data: './data/link_lines.geojson'
    });

map.addLayer({
        id: 'link_routes_line',
        type: 'line',
        source: 'link_routes',
        paint: {
            'line-color': [
                'match',
                ['get', 'line_number'],
                1, '#e6e605',
                2, '#fbb400',
                    '#000000'],
            'line-width': 4
        }
    });

map.setFilter('link_routes_line', ['<=', ['number', ['get', 'open_year']], default_year]);


// Add Census tracts layers

map.addSource('census_tracts', {
        type: 'geojson',
        data: './data/census_tracts_treated.geojson'
    });

// fill layer
map.addLayer({
        id: 'census_tracts_fill',
        type: 'fill',
        source: 'census_tracts',
        layout: {
            'visibility': 'visible'
        },
        paint: {
            'fill-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'med_income'],
                    0,
                    '#E9ECF7',
                    50000,
                    '#B2C6ED',
                    100000,
                    '#81A9D6',
                    150000,
                    '#4C7A9F',
                    200000,
                    '#496781'
                ],
                'fill-opacity': 0.8
        },
        slot: 'middle' // middle slot in Mapbox Standard style
    });

map.setFilter('census_tracts_fill', ['==', ['number', ['get', 'acs_year']], default_census_year]);


// treated outline layer
map.addLayer({
    id: 'census_tracts_line',
    type: 'line',
    source: 'census_tracts',
    layout: {
        'visibility': 'visible'
    },
    paint: {
            'line-color': '#ffffff' 
    },
    slot: 'middle' // middle slot in Mapbox Standard style
});

map.setFilter('census_tracts_line', ['<=', ['number', ['get', 'treat_year']], default_year]);



// Add year slider interactivity 
const slider = document.getElementById('myRange');
const displayYearEl = document.getElementById('display_year');

if (slider) {
  slider.addEventListener('input', (event) => {

    // identify target year set by slider and corresponding year for census data
    const year = parseInt(event.target.value);
    let census_year = year;

    if (year < 2010) {
        census_year = 2010;
    } else if (year > 2024) {
        census_year = 2024;
    }

    // update the map
    map.setFilter('link_routes_line', ['<=', ['number', ['get', 'open_year']], year]);
    map.setFilter('station_markers', ['<=', ['number', ['get', 'open_year']], year]);
    map.setFilter('census_tracts_line', ['<=', ['number', ['get', 'treat_year']], year]);
    map.setFilter('census_tracts_fill', ['==', ['number', ['get', 'acs_year']], census_year]);

    // update the figure for the selected year
    document.getElementById('year-figure').src = `figures/income_plot_${year}.png`;

    // update text in the UI
    if (displayYearEl) {
      displayYearEl.innerText = year;
    }
  });
} else {
  console.warn('Slider element not found: #myRange');
}

// Add popup with station name when station marker is clicked
map.addInteraction('station_markers_click_interaction', {
    type: 'click',
    target: { layerId: 'station_markers' },
    handler: (e) => {
        // Copy coordinates array.
        const coordinates = e.feature.geometry.coordinates.slice();
        const description = e.feature.properties.station;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${description}</strong>`)
            .addTo(map);
    }
});

// Add popup with tract median income when census tract is clicked
map.addInteraction('census_tracts_click_interaction', {
    type: 'click',
    target: { layerId: 'census_tracts_fill' },
    handler: (e) => {
        // Copy coordinates array.
        const coordinates = e.feature.geometry.coordinates.slice();
        const med_income = e.feature.properties.med_income;

        let displayIncome;
        if (med_income == 250000) {
            displayIncome = '$250,000+';
        } else {
            displayIncome = `$${med_income.toLocaleString()}`;
        }

        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>Median income: </strong> ${displayIncome}`)
            .addTo(map);
    }
});

// Change the cursor to a pointer when the mouse is over a POI - station marker or census tract
map.addInteraction('station_markers_mouseenter_interaction', {
    type: 'mouseenter',
    target: { layerId: 'station_markers' },
    handler: () => {
        map.getCanvas().style.cursor = 'pointer';
    }
});

map.addInteraction('tracts_mouseenter_interaction', {
    type: 'mouseenter',
    target: { layerId: 'census_tracts_fill' },
    handler: () => {
        map.getCanvas().style.cursor = 'pointer';
    }
});

// Change the cursor back to a pointer when it stops hovering over a POI.
map.addInteraction('station_markers_mouseleave_interaction', {
    type: 'mouseleave',
    target: { layerId: 'station_markers' },
    handler: () => {
        map.getCanvas().style.cursor = '';
    }

});

map.addInteraction('tracts_mouseleave_interaction', {
    type: 'mouseleave',
    target: { layerId: 'census_tracts_fill' },
    handler: () => {
        map.getCanvas().style.cursor = '';
    }

});


});


