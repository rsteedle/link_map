// set mapbox access token   
mapboxgl.accessToken = 'pk.eyJ1IjoicnVieXN0ZWVkbGUiLCJhIjoiY21uaTJ1YnBkMDk0NDJxb29qaG5hNXl3eSJ9.6yIA6pZliTXFh_X7iZHfig';

////////
// CREATE MAP
////////

// set constant for center of map
const seattle_ll = [-122.33935, 47.60774];

// declare map options
const mapOptions = {
    zoom: 10, 
    center: seattle_ll, 
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

// Add station markers layer

map.addSource('link_stations', {
        type: 'geojson',
        data: './data/station_data.geojson'
})

map.addLayer({
        id: 'station_markers',
        type: 'circle',
        source: 'link_stations',
        layout: {
            'visibility': 'visible'
        },
        paint: {
            'circle-radius': 6,
            'circle-color': [
                'match',
                ['get', 'STATUS'],
                'Existing / Under Construction', '#2E7D32', // green
                'Future', '#1976D2', // blue
                '#999999' // gray fallback
            ],
            'circle-opacity': 0.8
        }
    });

// Add Link lines layer

map.addSource('link_routes', {
        type: 'geojson',
        data: './data/link_line_data.geojson'
    });

map.addLayer({
        id: 'link_routes_line',
        type: 'line',
        source: 'link_routes',
        paint: {
            'line-color': [
                'match',
                ['get', 'DESCRIPTIO'],
                'Central Link', '#223b53',      // dark blue
                'University Link', '#223b53', 

                'Airport Link', '#223b53',  // red
                'Tacoma Link', '#3bb2d0',     // teal
                'North Link', '#223b53', // diff green
                'East Link', '#56b881', // green 
                'Angle Lake', '#223b53', // maroon
                'Lynnwood Link', '#223b53', // light green
                'Ballard / West Seattle', '#d5ba30', // yellow
                '#cccccc'    // gray fallback
            ],
            'line-width': 5,
            'line-opacity': [
                'match',
                ['get', 'STATUS'],
                'Existing / Under Construction', 1,
                'Future', 0.7,
                0.5 // default opacity
            ]
        }
    });


// Add checkboxes to toggle which layers are visible

document.getElementById('station-toggle').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('station_markers', 'visibility', visibility);
});

document.getElementById('line-toggle').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('link_routes_line', 'visibility', visibility);
});

// Add popup with station name when station marker is clicked
map.addInteraction('station_markers_click_interaction', {
    type: 'click',
    target: { layerId: 'station_markers' },
    handler: (e) => {
        // Copy coordinates array.
        const coordinates = e.feature.geometry.coordinates.slice();
        const description = e.feature.properties.STATION;
        const status = e.feature.properties.STATUS;

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`<strong>${description}</strong><br>Status: ${status}`)
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


// // create station status legend
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


