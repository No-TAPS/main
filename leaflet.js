// leaflet.js

// Coordinates for UCSC
var ucscCoordinates = [36.9914, -122.0586];

// // Initialize the map
var map = L.map('map').setView(ucscCoordinates, 15);

// // Add a tile layer (using OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// // Add a marker for UCSC
// L.marker(ucscCoordinates).addTo(map)
//     .bindPopup('University of California, Santa Cruz (UCSC)')
//     .openPopup();


//////////// coordinate
function handleFile() {
    console.log("starting");
    var fileName = 'Parking Cords.xlsx';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', fileName, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function (e) {
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

            // Process the data and add polygons to the map
            processDataAndDisplayPolygons(jsonData);
        } else {
            alert('Failed to load the Excel file. Please check the file path and try again.');
        }
    };

    xhr.send();
}

function processDataAndDisplayPolygons(data) {
    console.log('Processing data and displaying polygons...');

    data.forEach(function (row) {
        // Extract area number and name
        var areaNumber = row['Area Number'];
        var areaName = row['Area Name'];

        // Extract and process the coordinates
        var coordinates = [];
        for (var key in row) {
            if (key !== 'Area Number' && key !== 'Area Name') {
                var coords = row[key].split(',').map(function(coord) {
                    return parseFloat(coord.trim());
                });
                coordinates.push(coords);
            }
        }

        // Create a polygon and add it to the map
        L.polygon(coordinates, { color: 'blue', fillOpacity: 0.5 })
            .bindPopup(`<b>${areaName}</b><br>Area Number: ${areaNumber}`)
            .addTo(map);
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

handleFile();
