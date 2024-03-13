// leaflet.js

////////////////////// MAP INITIALIZATION /////////////////////////// 
// Coordinates for UCSC
var ucscCoordinates = [36.9914, -122.0586];

////////////////////// Initialize the map///////////////////////////
var map = L.map('map', {
    zoomControl: false
}).setView(ucscCoordinates, 15);

// Add a tile layer (using OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// first time user guide
// var tooltip = L.tooltip({direction: 'right'})
//     .setLatLng([36.990706, -122.050885])
//     .setContent('User Guide<br />Single click on the parking lot to get detail info. <br />Double click for reporting.')
//     .addTo(map);
// map.on('click', function () {
//     tooltip.closeTooltip();
// });

///////////////// Help Button Function //////////////////////////////
document.addEventListener('DOMContentLoaded', function () {
    var helpButton = document.getElementById('help-button');
    var helpContent = document.getElementById('help-content');

    if (helpButton && helpContent) {
        helpButton.addEventListener('click', function () {
            helpContent.style.display = (helpContent.style.display === 'none' || helpContent.style.display === '') ? 'block' : 'none';
        });

        // Close help guide when clicking outside of it
        map.on('click', function (event) {
            if (!helpButton.contains(event.target) && !helpContent.contains(event.target)) {
                helpContent.style.display = 'none';
            }
        });
    }
});


///////////////////// GLOBALS /////////////////////
var fullnesspopup;
var tapspopup;
var query = {};

var wicon = L.icon({
    iconUrl: 'warning-icon.png',
    iconSize: [10, 10] 
});

/////////////////////// AUTO UPDATE LOGIC ///////////////////////
setInterval(reset_map, 60000);
async function reset_map() {
    map.eachLayer(await function(layer){
        if(layer instanceof L.Polygon && !(layer instanceof L.Rectangle) ){
            layer.remove();
        }
    });
    await readjson();
}

/////////////////////// SEARCH QUERY ///////////////////////
function create_query(search_query) {
    var out = {}

    if (search_query["name"] != "") {
        out["name"] = search_query["name"]
    }
    if (search_query["permits"].length > 0) {
        out["permits"] = search_query["permits"];
    }
    if (search_query["r_c_after_5"]) {
        out["r_c_after_5"] = search_query["r_c_after_5"];
    }
    if (search_query["parkmobile_hourly"] > 0) {
        out["parkmobile_hourly"] = search_query["parkmobile_hourly"];
    }
    if (search_query["parkmobile_daily"]) {
        out["parkmobile_daily"] = search_query["parkmobile_daily"];
    }
    if (search_query["parkmobile_eve_wknd"]) {
        out["parkmobile_eve_wknd"] = search_query["parkmobile_eve_wknd"];
    }

    query = out;
    reset_map();
}

//////////////////////////////// COLOR LOGIC ////////////////////////////////////
var color = 'rgb(0,255,50)';
var avail_zero = 'rgb(0,255,0)';
var avail_one = 'rgb(165, 255, 0)';
var avail_two = 'rgb(255, 255, 0)';
var avail_three = 'rgb(255, 165, 0)';
var avail_four = 'rgb(255,0,0)';

/// Ramdom RGB Color ///
function getRandomRGBColor() {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

async function get_color(key) {
    const colors = [avail_zero, avail_one, avail_two, avail_three, avail_four];
    const jsonURL = 'http://localhost:3000/parking-lot/' + key; 

    try {
        const response = await fetch(jsonURL);
        if (response.ok) {
            const data = await response.json();
            if (data.hasOwnProperty('fullness')) {
                return colors[data.fullness];
            }
        } else {
            console.error('Error fetching data:', response.status);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    return colors[4]; 
}

///////////////////////////// GET TAPS REPORTING /////////////////////////////
async function get_taps(key) {
    const jsonURL = `http://localhost:3000/parking-lot/` + key; 

    try {
        const response = await fetch(jsonURL);
        if (response.ok) {
            const data = await response.json();
            if (data.hasOwnProperty('taps')) {
                return data.taps; 
            }
        } else {
            console.error('Error fetching data:', response.status);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    return 0; 
}


//////////////// DISPLAY PARKING LOTS //////////////////
function readjson() {
    // URL of the JSON data
    var jsonURL = 'http://localhost:3000/ParkingCordsJson';
    // Creating a new XMLHttpRequest object to fetch data from the server
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonURL, true);
    xhr.responseType = 'json';

    // Event handler for when the request finishes
    xhr.onload = async function () {
        // if success
        if (xhr.status === 200) {
            // Extracting JSON data from the response
            var jsonData = xhr.response;

            // Checking if there are any query parameters from the searching
            if (Object.keys(query).length) {
                console.log(query);
                const processor = new JsonProcessor(jsonData);
                // Filtering the JSON data based on query parameters
                jsonData = Object.fromEntries(processor.searchByMultipleCriteria(query));
            }
            //console.log(jsonData)

            // parse the data
            for (var key in jsonData) {
                //console.log(key);
                if (jsonData.hasOwnProperty(key)) {
                    // Accessing the area object corresponding to the current key
                    var area = jsonData[key];
                    var coordinates = area.perimeter.map(function(coord){
                        return [coord[0], coord[1]];
                    });

                    // information on the popup
                    var popupContent = `
                        <b>${area.name} (${key})</b><br>
                        Address: ${area.address}<br>
                        Permits: ${area.permits.join(', ')}<br>
                        R/C permit After 5: ${get_icon(area.r_c_after_5)}<br>
                        Parkmobile Hourly: ${area.parkmobile_hourly}<br>
                        Parkmobile Daily: ${get_icon(area.parkmobile_daily)}<br>
                        Parkmobile Evening/Weekend: ${get_icon(area.parkmobile_eve_wknd)}
                    `;

                    var polygon = L.polygon(coordinates, { fillColor: await get_color(key), fillOpacity: 0.3 })
                    .addTo(map)
                    .bindPopup(popupContent) 

                    //right click function
                    .on('contextmenu', get_menu_function(key, area));

                    // a Set to keep track of added markers
                    const addedMarkers = new Set();

                    // taps warning
                    var tapspresence = await get_taps(key);
                    
                    console.log(key, tapspresence);
                
                    if (tapspresence == 1) {
                        if (!addedMarkers.has(key)) {
                            var center = polygon.getBounds().getCenter();
                            L.marker(center, { icon: wicon }).addTo(map);
                            addedMarkers.add(key);
                        }
                    }
                }
            }
        } else {
            console.error('Failed to load Json File.');
        }
    };

    // Sending the XMLHttpRequest
    xhr.send();
}

function get_menu_function(key, area) {
    return function(event) {
        //console.log(key);

        //Right click popup window concept
        var rightClickPopupContent = '<b>' + area.name + 
                '<br />' + key + 
                '<br />' + '<button id="reportfullness">Report Fullness</button>' +
                '<button id="reporttaps">Report Taps</button>';

        //Creating a popup at the clicked location
        L.popup()
            .setLatLng(event.latlng)
            .setContent(rightClickPopupContent)
            .openOn(map);

        // Event listener for the "Report Fullness" button
        document.getElementById('reportfullness').addEventListener('click', function () {
            //map.closePopup(popup);
            var fullnessBoxContent = 
                '<div class="availability-buttons">' +
                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 0)">0<\/button>' +
                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 1)">1<\/button>' +
                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 2)">2<\/button>' +
                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 3)">3<\/button>' +
                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 4)">4<\/button>' +
                '<\/div>';
            
            fullnesspopup = L.popup()
                .setLatLng(event.latlng)
                .setContent(fullnessBoxContent)
                .openOn(map);
        });
            
        // Event listener for the "Report Taps" button
        document.getElementById('reporttaps').addEventListener('click', function () {
            //map.closePopup(popup);
            var tapsBoxContent = 
                '<div class="availability-buttons">' +
                '<button class="submit-button" onclick="submitTapsData(' + key + ')">TAPS</button>' +
                '</div>';

            tapspopup = L.popup()
                .setLatLng(event.latlng)
                .setContent(tapsBoxContent)
                .openOn(map);
        });
    }
}

function get_icon(value) {
    if (value) {
        return `<img class="bool-icon" src="check.png">`
    }
    return `<img class="bool-icon" src="remove.png">`
}

////////// Function to submit taps data ////////////
function submitTapsData(parkingLotId) {
    // Default value for taps
    var tapsValue = 1;
    // Timestamp for the current time
    var currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Sending a POST request to submit taps data
    fetch('http://localhost:3000/submitTapsData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parkingLotId, tapsValue, currentTimestamp }),
    })

    // Handling response
    .then(response => response.json())
    .then(data => console.log('Taps data submitted successfully:', data))
    .catch(error => console.error('Error submitting TAPS data:', error));
}

////////// Function to submit availability data ////////////
function submitAvailabilityData(parkingLotId, value) {
    
    // Sending a POST request to submit availability data
    fetch('http://localhost:3000/submitAvailabilityData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parkingLotId, availabilityValue: value }),
    })

    // Handling response
    .then(response => response.json())
    .then(data => console.log('Availability data submitted successfully:', data))
    .catch(error => console.error('Error submitting availability data:', error));
}

// Calling the readjson() function to initiate the process of reading JSON data
readjson();

