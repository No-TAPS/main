// leaflet.js

// Coordinates for UCSC
var ucscCoordinates = [36.9914, -122.0586];

// Initialize the map
var map = L.map('map').setView(ucscCoordinates, 15);

// Add a tile layer (using OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add a marker for UCSC
L.marker(ucscCoordinates).addTo(map)
    .bindPopup('University of California, Santa Cruz (UCSC)')
    .openPopup();
