const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes to allow cross-origin requests

// POST route to increment clicks
app.post('/updateClicks', (req, res) => {
    const { parkingLotId } = req.body;
    const path = './mapData.json';

    fs.readFile(path, (err, data) => {
        let mapData = err ? {} : JSON.parse(data.toString());

        mapData[parkingLotId] = (mapData[parkingLotId] || 0) + 1;

        fs.writeFile(path, JSON.stringify(mapData, null, 2), (writeError) => {
            if (writeError) {
                res.status(500).send('Error updating the file.');
                return;
            }

            res.send({ success: true, parkingLotId, clicks: mapData[parkingLotId] });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
