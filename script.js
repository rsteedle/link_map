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
}

const map = new mapboxgl.Map(mapOptions);


/////////
// CREATE STATION MARKERS
/////////

var station_data = JSON.parse(data);

station_data.forEach((st) => {
    const marker = new mapboxgl.Marker({
        // TODO: add colors by station open status
        //color: programColors[studentData.program] || '#999999'

        color: "#F43433"
    })
        .setLngLat(st.coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
                .setText(`${st.STATION}`)
        )
        .addTo(map);
})

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