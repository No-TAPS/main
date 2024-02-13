const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); 

app.get('/ParkingCordsExcel', (req, res) => {
    const path = './Parking Cords.xlsx'; 
    const file = fs.createReadStream(path);
    file.pipe(res);
});

app.get('/ParkingCordsJson', (req, res) => {
    const path = './parking_data.json'; 
    const file = fs.createReadStream(path);
    file.pipe(res);
});

// app.get('./ParkingCordsJson', (req, res) => {
//     const path = './parking_data.json';
//     const { parkingLotId } = req.body;
//     fs.readFile(path, (err, data) => {
//         let cordData = err ? {} : JSON.parse(data.toString());
//         if (!cordData[parkingLotId].perimeter) {
//             res.send('Error: no perimeter defined');
//         }

//         res.send(cordData[parkingLotId].perimeter);
//     });
// } );

// POST route to update parking lot data
app.post('/updateParkingLot', (req, res) => {
    const { parkingLotId, fullnessRating, isTaps } = req.body;
    const path = './mapData.json';

    fs.readFile(path, (err, data) => {
        let mapData = err ? {} : JSON.parse(data.toString());

        // Initialize if parking lot ID doesn't exist
        if (!mapData[parkingLotId]) {
            mapData[parkingLotId] = { clicks: 0, fullness: 0, tapsPresence: false};
        }

        // Increment clicks and update fullness rating
        mapData[parkingLotId].clicks += 1;
        mapData[parkingLotId].fullness = fullnessRating;
        mapData[parkingLotId].tapsPresence = isTaps

        fs.writeFile(path, JSON.stringify(mapData, null, 2), (writeError) => {
            if (writeError) {
                res.status(500).send('Error updating the file.');
                return;
            }

            res.send({ success: true, parkingLotId, data: mapData[parkingLotId] });
        });
    });
});

app.post('/submitAvailabilityData', (req, res) => {
    const { parkingLotId, availabilityValue } = req.body;
    const path = './mapData.json';

    fs.readFile(path, (err, data) => {
        let mapData = err ? {} : JSON.parse(data.toString());

        if (!mapData[parkingLotId]) {
            mapData[parkingLotId] = {  availability: 0 };
        }

        mapData[parkingLotId].availability = availabilityValue;

        fs.writeFile(path, JSON.stringify(mapData, null, 2), (writeError) => {
            if (writeError) {
                res.status(500).send('Error updating the file.');
                return;
            }

            res.send({ success: true, parkingLotId, data: mapData[parkingLotId] });
        });
    });
});


app.post('/submitTapsData', (req, res) => {
    const { parkingLotId, tapsValue } = req.body;
    const path = './mapData.json';

    fs.readFile(path, (err, data) => {
        let mapData = err ? {} : JSON.parse(data.toString());

        if (!mapData[parkingLotId]) {
            mapData[parkingLotId] = { tapsPresence: false };
        }
        mapData[parkingLotId].tapsPresence = tapsValue;

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
