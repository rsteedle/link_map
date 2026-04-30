// set mapbox access token   
mapboxgl.accessToken = 'pk.eyJ1IjoicnVieXN0ZWVkbGUiLCJhIjoiY21uaTJ1YnBkMDk0NDJxb29qaG5hNXl3eSJ9.6yIA6pZliTXFh_X7iZHfig';

////////
// CREATE MAP
////////

// declare map options
const mapOptions = {
    zoom: 10, 
    maxZoom: 11,
    minZoom: 9,
    center: [-122.33935, 47.60774], // set default center to downtown Seattle
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
            'circle-color': '#0e440a',
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
                1, '#5b9452',
                2, '#83dd73',
                    '#000000'],
            'line-width': 4
        }
    });

map.setFilter('link_routes_line', ['<=', ['number', ['get', 'open_year']], default_year]);


// Add Census tracts layer

map.addSource('census_tracts', {
        type: 'geojson',
        data: './data/tract_income.geojson'
    });

// function loadDataForYear(year) {
//     const style = map.getStyle();
//     style.layers.find(({ id }) => id === "emissions").paint['fill-color']['property'] = 'total_' + year;
//     map.setStyle(style);
// }

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
                'fill-opacity': 0.4
        },
        slot: 'middle' // middle slot in Mapbox Standard style
    });




// Add year slider interactivity 
document.getElementById('slider').addEventListener('input', (event) => {
  const year = parseInt(event.target.value);
  // update the map
  map.setFilter('link_routes_line', ['<=', ['number', ['get', 'open_year']], year]);
  map.setFilter('station_markers', ['<=', ['number', ['get', 'open_year']], year]);

  // update text in the UI
  document.getElementById('display_year').innerText = year;
});







// Add checkboxes to toggle which layers are visible

// document.getElementById('station-toggle').addEventListener('change', (e) => {
//     const visibility = e.target.checked ? 'visible' : 'none';
//     map.setLayoutProperty('station_markers', 'visibility', visibility);
// });

// document.getElementById('line-toggle').addEventListener('change', (e) => {
//     const visibility = e.target.checked ? 'visible' : 'none';
//     map.setLayoutProperty('link_routes_line', 'visibility', visibility);
// });

document.getElementById('income-toggle').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('census_tracts_fill', 'visibility', visibility);
});

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

// Change the cursor to a pointer when the mouse is over a POI.
map.addInteraction('station_markers_mouseenter_interaction', {
    type: 'mouseenter',
    target: { layerId: 'station_markers' },
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

// map.scrollZoom.disable();

// // create station status legend
// deleted legend for now - added status to station popup instead 


// const legend = document.getElementById('legend');


// const color = map.getPaintProperty('station_markers', 'circle-color');
// const item = document.createElement('div');
// const key = document.createElement('span');
// key.className = 'legend-key';
// key.style.backgroundColor = color;

// const value = document.createElement('span');
// value.innerHTML = `${layer}`;
// item.appendChild(key);
// item.appendChild(value);
// legend.appendChild(item);



//////////
// CREATE MAP HEADER
//////////

const header = document.createElement('div');
header.className = 'header';
header.innerHTML = `
    <h1>Link Light Rail Stations</h1>
    <p class="call-to-action">Click the markers to see each station's name and opening status.</p>
`;

document.body.appendChild(header);

});


