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

/////////
// CREATE STATION MARKERS
/////////

// const stations = JSON.parse(station_data);

// load JSON file with station locations, names, and statuses
// fetch('data/station_data.json')
//   .then(res => res.json())
//   .then(station_data => {
//     station_data.forEach((station_obj) => {
//       const marker = new mapboxgl.Marker({
//         color: statusColors[station_obj.STATUS] || '#999999'
//       })
//         .setLngLat([station_obj.longitude, station_obj.latitude])
//         .setPopup(
//           new mapboxgl.Popup({ offset: 25 })
//             .setText(`${station_obj.STATION}`)
//         )
//         .addTo(map);
//     });
//   })

/////////
// ADD LINK STATIONS LAYER
/////////

map.addSource('link_stations', {
        type: 'geojson',
        data: './data/station_data.geojson'
})

map.addLayer({
        id: 'station-markers',
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


/////////
// ADD LINK LINES LAYER
/////////

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


// Layer toggle checkboxes
document.getElementById('station-toggle').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('station-markers', 'visibility', visibility);
});

document.getElementById('line-toggle').addEventListener('change', (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('link_routes_line', 'visibility', visibility);
});



//////////
// CREATE MAP LEGEND
//////////
const legend = document.createElement('div');
legend.className = 'legend';
legend.innerHTML = '<h4>Station status</h4>';

Object.entries(statusColors).forEach(([station, color]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
        <span class="legend-circle" style="background-color: ${color}"></span>
        <span class="legend-label">${station}</span>
    `;
    legend.appendChild(item);
});

document.body.appendChild(legend);

//////////
// CREATE MAP HEADER
//////////

const header = document.createElement('div');
header.className = 'header';
header.innerHTML = `
    <h1>Link Light Rail Stations</h1>
    <p class="description">This map shows the locations of all current and proposed Link Light Rail stations.</p>
    <p class="call-to-action">Click the markers to see the station names</p>
`;

document.body.appendChild(header);

});


