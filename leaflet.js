// leaflet.js
//setTimeout()
//unit test
//double click

// Coordinates for UCSC
var ucscCoordinates = [36.9914, -122.0586];

// Initialize the map
var map = L.map('map').setView(ucscCoordinates, 15);

// Add a tile layer (using OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// first time user guide
var tooltip = L.tooltip({direction: 'right'})
    .setLatLng([36.990706, -122.050885])
    .setContent('User Guide<br />Single click on the parking lot to get detail info. <br />Double click for reporting.')
    .addTo(map);

// var fuserguide = L.popup()
//     .setLatLng(ucscCoordinates)
//     .setContent("I am a standalone popup.")
//     .openOn(map);

// // Add a marker for UCSC
// L.marker(ucscCoordinates).addTo(map)
//     .bindPopup('University of California, Santa Cruz (UCSC)')
//     .openPopup();




///////////// Ramdom RGB color
function getRandomRGBColor() {
    var r = Math.floor(Math.random() * 256);
    var g = Math.floor(Math.random() * 256);
    var b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

// text box setting
function createTextBox(content, latlng) {
    var textBox = document.createElement('div');
    textBox.className = 'text-box';
    textBox.innerHTML = content;

    // Set the position of the text box
    var containerPoint = map.latLngToContainerPoint(latlng);
    textBox.style.position = 'absolute';
    textBox.style.left = containerPoint.x + 'px';
    textBox.style.top = containerPoint.y + 'px';

    // Append the text box to the map container
    map.getContainer().appendChild(textBox);

    // Add a close button event listener
    textBox.getElementsByClassName('close-button')[0].addEventListener('click', function () {
        textBox.remove(); // Remove the text box when the close button is clicked
    });

    // Return the created text box
    return textBox;
}



//////////// coordinate
function readjson() {
    var jsonURL = 'http://localhost:3000/ParkingCordsJson';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', jsonURL, true);
    xhr.responseType = 'json';

    xhr.onload = function () {
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

                    L.polygon(coordinates, { fillColor: 'rgb(0,255,0)', fillOpacity: 0.3 })
                    .addTo(map)
                    .bindPopup(popupContent) 
                    //right click function
                    .on('contextmenu', function (event) {
                        var rightClickPopupContent = '<b>' + area.name + 
                                '<br />' + key + 
                                '<br />' + '<button id="reportfullness">Report Fullness</button>' +
                                '<button id="reporttaps">Report Taps</button>';

                        L.popup()
                            .setLatLng(event.latlng)
                            .setContent(rightClickPopupContent)
                            .openOn(map);

                        document.getElementById('reportfullness').addEventListener('click', function () {
                            map.closePopup(popup);
                            var fullnessBoxContent = 
                                '<div class="availability-buttons">' +
                                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 0)">0</button>' +
                                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 1)">1</button>' +
                                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 2)">2</button>' +
                                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 3)">3</button>' +
                                '<button class="availability-button" onclick="submitAvailabilityData(' + key + ', 4)">4</button>' +
                                '</div>';

                            var fullnesspopup = L.popup()
                                .setLatLng(event.latlng)
                                .setContent(fullnessBoxContent)
                                .openOn(map);
                        });
                            

                        document.getElementById('reporttaps').addEventListener('click', function () {
                            map.closePopup(popup);
                            var tapsBoxContent = 
                                '<div class="availability-buttons">' +
                                '<button class="submit-button" onclick="submitTapsData(' + key + ')">TAPS</button>' +
                                '</div>';

                            var tapspopup = L.popup()
                                .setLatLng(event.latlng)
                                .setContent(tapsBoxContent)
                                .openOn(map);
                        });
                    });
                }
            }
        } else {
            console.error('Failed to load Json File.');
        }
    };

    xhr.send();
}


// excel handle files
function handleFile() {
    //console.log("starting");

    var url = 'http://localhost:3000/ParkingCordsExcel';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('Excel file loaded successfully.');

            var data = new Uint8Array(xhr.response);
            var workbook = XLSX.read(data, { type: 'array' });
            var sheetName = workbook.SheetNames[0];
            var sheet = workbook.Sheets[sheetName];
            var jsonData = XLSX.utils.sheet_to_json(sheet);

            // Ensure the map is cleared before adding new polygons
            map.eachLayer(function (layer) {
                if (layer instanceof L.Polygon) {
                    map.removeLayer(layer);
                }
            });

            //processDataAndDisplayPolygons(jsonData);
        } else {
            alert('Failed to load the Excel file. Please check the server route and try again.');
        }
    };

    xhr.send();
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


// var westremote = L.polygon([
//     [36.98874277751547, -122.06693840060198],
//     [36.98869870002297, -122.0647122482799],
//     [36.988368765753805, -122.06470151944461],
//     [36.988418496559866, -122.06689780232429]
    
// ]).addTo(map);

// var n165 = L.polygon([
//                     [37.000281608809644, -122.05894317125187],
//     	            [37.00024049224933, -122.05905527882427],
//                     [37.00030618934344, -122.05910900092745],
//                     [37.00025524058154, -122.05924834263263],
//                     [37.00067757797115, -122.05930542236729],
//                     [37.00083578629834, -122.05935242920809],
//                     [37.00099667578452, -122.05946323104668],
//                     [37.00134526849852, -122.0594447640743],
//                     [37.00139487579278, -122.0592886342119],
//                     [37.00127555008433, -122.05917111711115],
//                     [37.001180357530934, -122.05919294171555],
//                     [37.00100069802089, -122.0590351330374],
//                     [37.00086528273348, -122.05896798040662],
//                     [37.00046707995032, -122.0589478346173]
// ]).addTo(map);											

// var circle = L.circle([36.988506, -122.065921], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 50
// }).addTo(map);


//////////// pop up window
// var popup = L.popup();

//tool for get the coordinates
// function onMapClick(e) {
//     popup
//         .setLatLng(e.latlng)
//         .setContent("You clicked the map at " + e.latlng.toString())
//         .openOn(map);
// }

// map.on('click', onMapClick);

///////////// icon
// var warningicon = L.icon({
//     iconUrl: 'download.png',
//     iconSize: [12, 12],
//     iconAnchor: [8, 8]
//     // popupAnchor: [-3, -76]
//     // shadowUrl: 'my-icon-shadow.png',
//     // shadowSize: [68, 95],
//     // shadowAnchor: [22, 94]
// });

// L.marker([36.98853587549755, -122.06590851341495], {icon: warningicon}).addTo(map);

//handleFile();

function toggleTextBox(boxId) {
    var currentBox = document.getElementById(boxId);
    currentBox.style.display = (currentBox.style.display === 'none' || currentBox.style.display === '') ? 'block' : 'none';
}

function submitTapsData(parkingLotId) {
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

