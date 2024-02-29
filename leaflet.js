// leaflet.js
//setTimeout()
//unit test
//double click

// Coordinates for UCSC
var ucscCoordinates = [36.9914, -122.0586];

// Initialize the map
var map = L.map('map', {
    zoomControl: false
}).setView(ucscCoordinates, 15);

// Add a tile layer (using OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// first time user guide
var tooltip = L.tooltip({direction: 'right'})
    .setLatLng([36.990706, -122.050885])
    .setContent('User Guide<br />Single click on the parking lot to get detail info. <br />Double click for reporting.')
    .addTo(map);
map.on('click', function () {
    tooltip.closeTooltip();
});
/// Global Varible ///
var fullnesspopup;
var tapspopup;


var wicon = L.icon({
    iconUrl: 'warning-icon.png',
    iconSize: [10, 10] 
  });


////////////////////// COLOR LOGIC //////////////////////
var color = 'rgb(0,255,50)';
var avail_zero = 'rgb(255,0,0)';
var avail_one = 'rgb(255, 165, 0)';
var avail_two = 'rgb(255, 255, 0)';
var avail_three = 'rgb(165, 255, 0)';
var avail_four = 'rgb(0,255,0)';
/// Ramdom RGB Color ///
function getRandomRGBColor() {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

async function get_color(key) {
    var colors = [avail_zero, avail_one, avail_two, avail_three, avail_four];
    var jsonURL = 'http://localhost:3000/ParkingStatus';
    var idx = 4;
    await fetch(jsonURL)
        .then(res => res.json())
        .then(data => {
            if (data.hasOwnProperty(key)) {
                idx = data[key].availability;
            }
        })
        .catch(error => console.log(error));
    return colors[idx];
}

async function get_taps(key){
    var jsonURL = 'http://localhost:3000/ParkingStatus';
    var tapspresence = false;
    await fetch(jsonURL)
        .then(res => res.json())
        .then(data => {
            if (data.hasOwnProperty(key)) {
                tapspresence = data[key].tapsPresence;
            }
        })
        .catch(error => console.log(error));
    return tapspresence;
}

// text box setting
function createTextBox(content, latlng) {
    var textBox = document.createElement('div');
    textBox.className = 'text-box';
    textBox.innerHTML = content;

    var containerPoint = map.latLngToContainerPoint(latlng);
    textBox.style.position = 'absolute';
    textBox.style.left = containerPoint.x + 'px';
    textBox.style.top = containerPoint.y + 'px';

    
    map.getContainer().appendChild(textBox);

    textBox.getElementsByClassName('close-button')[0].addEventListener('click', function () {
        textBox.remove(); 
    });

    return textBox;
}

//////////////// DISPLAY PARKING LOTS //////////////////
function readjson() {
    var jsonURL = 'http://localhost:3000/ParkingCordsJson';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonURL, true);
    xhr.responseType = 'json';

    xhr.onload = async function () {
        if (xhr.status === 200) {
            var jsonData = xhr.response;
            // parse the data
            for (var key in jsonData) {
                if (jsonData.hasOwnProperty(key)) {
                    var area = jsonData[key];
                    var coordinates = area.perimeter.map(function(coord){
                        return [coord[0], coord[1]];
                    });

                    var permitsDropdown = '<select>';
                    for (var i = 0; i < area.permits.length; i++) {
                        permitsDropdown += '<option value="' + area.permits[i] + '">' + area.permits[i] + '</option>';
                    }
                    permitsDropdown += '</select>';

                    var question = 'Do you have a permit?';

                    var popupContent = '<b>' + area.name + '</b><br>Address: ' + area.address + '<br>' +
                                       'Permits: ' + permitsDropdown + '<br>' +
                                       question;


                    // information on the popup
                    var popupContent = `
                        <b>Area Number: ${key}</b><br>
                        Name: ${area.name}<br>
                        Address: ${area.address}<br>
                        Permits: ${area.permits.join(', ')}<br>
                        R/C permit After 5: ${area.r_c_after_5}<br>
                        Parkmobile Hourly: ${area.parkmobile_hourly}<br>
                        Parkmobile Daily: ${area.parkmobile_daily}<br>
                        Parkmobile Evening/Weekend: ${area.parkmobile_eve_wknd}
                    `;

                    // L.polygon(coordinates, { fillColor: 'rgb(0,255,0)', fillOpacity: 0.2 })
                    //     .bindPopup(popupContent)
                    //     .addTo(map);

                    var polygon = L.polygon(coordinates, { fillColor: await get_color(key), fillOpacity: 0.3 })
                    .addTo(map)
                    .bindPopup(popupContent) 
                    //right click function
                    .on('contextmenu', get_menu_function(key, area));
                    // taps warning
                    var tapspresence = get_taps(key);
                    tapspresence.then(function(value) {
                        //console.log(key, value);
                        if (value == true){
                            var center = polygon.getBounds().getCenter();
                            L.marker(center, {icon: wicon}).addTo(map);
                        }
                    })
                    .catch(function(error) {
                        console.error(error);
                    });
                
                }
            }
        } else {
            console.error('Failed to load Json File.');
        }
    };

    xhr.send();
}

function get_menu_function(key, area) {
    return function(event) {
        console.log(key);
        var rightClickPopupContent = '<b>' + area.name + 
                '<br />' + key + 
                '<br />' + '<button id="reportfullness">Report Fullness</button>' +
                '<button id="reporttaps">Report Taps</button>';

        L.popup()
            .setLatLng(event.latlng)
            .setContent(rightClickPopupContent)
            .openOn(map);

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

function processDataAndDisplayPolygons(data) {
    console.log('Processing data and displaying polygons...');

    data.forEach(function (row) {
        // Check if the row has valid keys
        if ('Lot Numbers' in row && 'names' in row) {
            // Extract area number and name
            var areaNumber = row['Lot Numbers'];
            var areaName = row['names'];

            // Extract and process the coordinates
            var coordinates = [];
            for (var key in row) {
                if (key !== 'Lot Numbers' && key !== 'names') {
                    // Check if the value is a string containing coordinates
                    if (typeof row[key] === 'string') {
                        var coordsList = row[key].split('\t');
                        for (var i = 0; i < coordsList.length; i++) {
                            var coords = coordsList[i].split(',').map(function(coord) {
                                return parseFloat(coord.trim());
                            });

                            // Check if coordinates are valid (not NaN)
                            if (!coords.some(isNaN) && coords.length === 2) {
                                coordinates.push(coords);
                            } else {
                                console.error(`Invalid coordinates for area ${areaNumber}: ${coords}`);
                            }
                        }
                    } else {
                        console.error(`Invalid coordinates format for area ${areaNumber}`);
                    }
                }
            }

            // Check if any valid coordinates were extracted
            if (coordinates.length > 0) {
                // debug
                // console.log(`Area Number: ${areaNumber}`);
                // console.log(`Area Name: ${areaName}`);
                // console.log(`Coordinates:`, coordinates);

                // Create a polygon and add it to the map
                L.polygon(coordinates, { fillColor: 'rgb(0,255,0)', fillOpacity: 0.3 })
                    .bindPopup(`<b>${areaName}</b><br>Area Number: ${areaNumber}`)
                    .addTo(map);
            } else {
                console.error(`No valid coordinates found for area ${areaNumber}`);
            }
        } else {
            console.error(`Invalid area number or name for row:`, row);
        }
    });

    console.log('Polygons displayed.');
}

function toggleTextBox(boxId) {
    var currentBox = document.getElementById(boxId);
    currentBox.style.display = (currentBox.style.display === 'none' || currentBox.style.display === '') ? 'block' : 'none';
}

function submitTapsData(parkingLotId) {
    map.closePopup(tapspopup);
    var tapsValue = true;

    fetch('http://localhost:3000/submitTapsData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parkingLotId, tapsValue }),
    })
    .then(response => response.json())
    .then(data => console.log('Taps data submitted successfully:', data))
    .catch(error => console.error('Error submitting taps data:', error));
}

function submitAvailabilityData(parkingLotId, value) {
    map.closePopup(fullnesspopup);
    fetch('http://localhost:3000/submitAvailabilityData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parkingLotId, availabilityValue: value }),
    })
    .then(response => response.json())
    .then(data => console.log('Availability data submitted successfully:', data))
    .catch(error => console.error('Error submitting availability data:', error));
}


readjson();

