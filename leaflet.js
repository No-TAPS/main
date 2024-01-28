// leaflet.js

// Coordinates for UCSC
var ucscCoordinates = [36.9914, -122.0586];

// Initialize the map
var map = L.map('map').setView(ucscCoordinates, 15);

// Add a tile layer (using OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// // Add a marker for UCSC
// L.marker(ucscCoordinates).addTo(map)
//     .bindPopup('University of California, Santa Cruz (UCSC)')
//     .openPopup();

var westremote = L.polygon([
    [36.98874277751547, -122.06693840060198],
    [36.98869870002297, -122.0647122482799],
    [36.988368765753805, -122.06470151944461],
    [36.988418496559866, -122.06689780232429]
    
]).addTo(map);

//36.988506, -122.065921


// var circle = L.circle([36.988506, -122.065921], {
//     color: 'red',
//     fillColor: '#f03',
//     fillOpacity: 0.5,
//     radius: 50
// }).addTo(map);

var popup = L.popup();

function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(map);
}

map.on('click', onMapClick);


var warningicon = L.icon({
    iconUrl: 'download.png',
    iconSize: [12, 12],
    iconAnchor: [8, 8]
    // popupAnchor: [-3, -76]
    // shadowUrl: 'my-icon-shadow.png',
    // shadowSize: [68, 95],
    // shadowAnchor: [22, 94]
});

L.marker([36.98853587549755, -122.06590851341495], {icon: warningicon}).addTo(map);




