const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors()); 

app.get('/ParkingCordsJson', (req, res) => {
    const path = './parking_data.json'; 
    const file = fs.createReadStream(path);
    file.pipe(res);
});

app.get('/ParkingStatus', (req, res) => {
  const path = './mapData.json'; 
  const file = fs.createReadStream(path);
  file.pipe(res);
}); 


// Initial database connection configuration, without specifying a database
const dbConfig = {
  host: 'localhost',
  user: 'No-Taps',
  password: 'Taps'
};

const dbName = 'parkingLots';

// Create a connection to check for the database existence and to create it if it does not exist
const initialDbConnection = mysql.createConnection(dbConfig);

initialDbConnection.connect(err => {
  if (err) {
    console.error('Error connecting to the MySQL server:', err);
    return;
  }
  console.log("Connected to MySQL server successfully!");

  // Create the database if it doesn't exist
  initialDbConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err, result) => {
    if (err) throw err;
    console.log(`Database ${dbName} checked/created successfully`);
    
    // Use the database
    initialDbConnection.changeUser({database : dbName}, (err) => {
      if (err) throw err;

      // Create the table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS parking_lots (
          id INT AUTO_INCREMENT PRIMARY KEY,
          lot_id INT NOT NULL,
          fullness DECIMAL(5, 2) NOT NULL,
          availability BOOLEAN NOT NULL
        )`;

      initialDbConnection.query(createTableQuery, (err, result) => {
        if (err) throw err;
        console.log("Table 'parking_lots' checked/created successfully");

        // Close the initial connection
        initialDbConnection.end();
      });
    });
  });
});

// Reconfigure the database connection to use the newly created database
const dbConnection = mysql.createConnection({
  ...dbConfig,
  database: dbName
});

// POST endpoint to receive parking lot data and write it to the database
app.post('/parking-lot', (req, res) => {
  const { lotId, fullness, availability } = req.body;

  if (lotId == null || fullness == null || availability == null) {
    return res.status(400).send('Missing data for lotId, fullness, or availability');
  }

  const query = `INSERT INTO parking_lots (lot_id, fullness, availability) VALUES (?, ?, ?)`;

  dbConnection.query(query, [lotId, fullness, availability], (err, result) => {
    if (err) {
      console.error('Failed to write parking lot data:', err);
      return res.status(500).send('Failed to write parking lot data');
    }
    console.log("Parking lot data written successfully:", result);
    res.status(201).send({ message: 'Parking lot data written successfully', id: result.insertId });
  });
});

app.post('/submitAvailabilityData', (req, res) => {
  const { parkingLotId, availabilityValue } = req.body;

  if (parkingLotId == null || availabilityValue == null) {
    return res.status(400).send('Missing data for parkingLotId or availabilityValue');
  }

  const query = `UPDATE parking_lots SET availability = ? WHERE lot_id = ?`;

  dbConnection.query(query, [availabilityValue, parkingLotId], (err, result) => {
    if (err) {
      console.error('Failed to update availability data:', err);
      return res.status(500).send('Failed to update availability data');
    }

    console.log('Availability data updated successfully:', result);
    res.status(200).send({ message: 'Availability data updated successfully' });
  });
});

app.post('/submitTapsData', (req, res) => {
  const { parkingLotId, tapsValue } = req.body;

  if (parkingLotId == null || tapsValue == null) {
    return res.status(400).send('Missing data for parkingLotId or tapsValue');
  }

  const query = `UPDATE parking_lots SET taps = ? WHERE lot_id = ?`;

  dbConnection.query(query, [tapsValue, parkingLotId], (err, result) => {
    if (err) {
      console.error('Failed to update taps data:', err);
      return res.status(500).send('Failed to update taps data');
    }

    console.log('Taps data updated successfully:', result);
    res.status(200).send({ message: 'Taps data updated successfully' });
  });
});

app.get('/parking-lot/:lotId', (req, res) => {
    const lotId = parseInt(req.params.lotId);
    
    if (isNaN(lotId)) {
        return res.status(400).send('Invalid lot ID');
    }

    const query = 'SELECT * FROM parking_lots WHERE lot_id = ?';

    dbConnection.query(query, [lotId], (err, results) => {
        if (err) {
            console.error('Failed to retrieve parking lot data:', err);
            return res.status(500).send('Failed to retrieve parking lot data');
        }

        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).send('Parking lot not found');
        }
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
