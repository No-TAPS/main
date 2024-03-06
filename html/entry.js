const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors());

// Ensure JSON files exist or create them
const ensureFileExists = (filePath, defaultData = '[]') => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, defaultData, 'utf8');
    }
};

const parkingDataPath = './parking_data.json';
const parkingStatusPath = './parking_status.json';

ensureFileExists(parkingDataPath); // Create with empty array as default
ensureFileExists(parkingStatusPath); // Create with empty array as default

// Serve parking coordinates JSON
app.get('/ParkingCordsJson', (req, res) => {
    const file = fs.createReadStream(parkingDataPath);
    file.pipe(res);
});

// Get parking status from JSON
app.get('/ParkingStatus', (req, res) => {
    fs.readFile(parkingStatusPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error reading parking status file." });
        }
        res.json(JSON.parse(data));
    });
});

// Update parking status in JSON
app.post('/UpdateParkingStatus', (req, res) => {
    const newStatus = req.body;
    fs.readFile(parkingStatusPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Error reading parking status file." });
        }
        const statuses = JSON.parse(data);
        const index = statuses.findIndex(status => status.spotId === newStatus.spotId);
        if (index !== -1) {
            statuses[index] = newStatus;
        } else {
            // If spot not found, add it to the array
            statuses.push(newStatus);
        }
        fs.writeFile(parkingStatusPath, JSON.stringify(statuses, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: "Error writing to parking status file." });
            }
            res.json({ message: "Parking status updated successfully." });
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
