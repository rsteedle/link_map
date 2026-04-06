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


/////////
// CREATE STATION MARKERS
/////////

// const stations = JSON.parse(station_data);

// create color mapping for station statuses
const statusColors = {
    'Existing / Under Construction': '#2E7D32',
    'Future': '#1976D2'
};

// load JSON file with station locations, names, and statuses
fetch('station_data.json')
  .then(res => res.json())
  .then(station_data => {
    station_data.forEach((station_obj) => {
      const marker = new mapboxgl.Marker({
        color: statusColors[station_obj.STATUS] || '#999999'
      })
        .setLngLat([station_obj.longitude, station_obj.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setText(`${station_obj.STATION}`)
        )
        .addTo(map);
    });
  })


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