const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS

// Serve the Excel file at a specific route
app.get('/ParkingCordsExcel', (req, res) => {
    const path = './Parking Cords.xlsx'; // Update the path to match the location of your Excel file
    const file = fs.createReadStream(path);
    file.pipe(res);
});

app.get('./ParkingCordsJson', (req, res) => {
    const path = './parking_data.json';
    const { parkingLotId } = req.body;
    fs.readFile(path, (err, data) => {
        let cordData = err ? {} : JSON.parse(data.toString());
        if (!cordData[parkingLotId].perimeter) {
            res.send('Error: no perimeter defined');
        }

        res.send(cordData[parkingLotId].perimeter);
    });
} );

// POST route to update parking lot data
app.post('/updateParkingLot', (req, res) => {
    const { parkingLotId, fullnessRating } = req.body;
    const path = './mapData.json';

    fs.readFile(path, (err, data) => {
        let mapData = err ? {} : JSON.parse(data.toString());

        // Initialize if parking lot ID doesn't exist
        if (!mapData[parkingLotId]) {
            mapData[parkingLotId] = { clicks: 0, fullness: 0 };
        }

        // Increment clicks and update fullness rating
        mapData[parkingLotId].clicks += 1;
        mapData[parkingLotId].fullness = fullnessRating;

        fs.writeFile(path, JSON.stringify(mapData, null, 2), (writeError) => {
            if (writeError) {
                res.status(500).send('Error updating the file.');
                return;
            }

            res.send({ success: true, parkingLotId, data: mapData[parkingLotId] });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
