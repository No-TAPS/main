const express = require('express');
const mysql = require('mysql2');
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
  host: 'db',
  user: 'No-Taps',
  password: 'Taps'
  
};

const dbName = 'parkingLots';


// Function to connect to the database with retry logic
function connectToDatabase(attempt = 1) {
  const connection = mysql.createConnection(dbConfig);

  connection.connect(err => {
    if (err) {
      console.error(`Error connecting to the MySQL server (Attempt ${attempt}):`, err);
      
      if (attempt < 10) { // Try to reconnect up to 5 times
        console.log(`Attempting to reconnect in 5 seconds...`);
        setTimeout(() => connectToDatabase(attempt + 1), 5000); // Wait 5 seconds before retrying
      } else {
        console.error('Failed to connect to the MySQL server after 10 attempts:', err);
        return;
      }
    } else {
      console.log("Connected to MySQL server successfully!");
      // Proceed with database and table setup...
      setupDatabase(connection);
    }
  });
}

// Function to setup database and tables
function setupDatabase(connection) {
  connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err, result) => {
    if (err) throw err;
    console.log(`Database ${dbName} checked/created successfully`);
    
    connection.changeUser({database : dbName}, err => {
      if (err) throw err;

      const createTableQuery = `
      CREATE TABLE IF NOT EXISTS parking_lots (
        lot_id INT PRIMARY KEY,
        fullness INT NOT NULL,
        taps INT NOT NULL
      )`;
    connection.query(createTableQuery, (err, result) => {
      if (err) {
        console.error("error creating table");
        throw err;
      }

      else{

      console.log("Table 'parking_lots' checked/created successfully");
      }

      global.dbConnection = connection; // Assigning to a global variable for accessibility
      console.log('dbconnection assigned');
      initializeParkingLotData();
      console.log('exited parkinglotdata');
    });
  });
});
}

const initializeParkingLotData = () => {
  // Read and parse the JSON file
  console.log('beginning function');
  fs.readFile('./parking_data.json', (err, data) => {
    if (err) {
      console.error("Error reading JSON file", err);
      return;
    }
    console.log('sucessfully read json file')
    const parkingData = JSON.parse(data);
    const lotIds = Object.keys(parkingData); // Assuming the JSON structure suits this

    // Assuming you're looping through lotIds to insert/update each
    lotIds.forEach(lotId => {
      const insertQuery = `
        INSERT INTO parking_lots (lot_id, fullness, taps)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        fullness = VALUES(fullness),
        taps = VALUES(taps);
      `;

      // Execute the query for each parking lot
      global.dbConnection.query(insertQuery, [lotId, 0, 0], (err, results) => {
        if (err) {
          //console.error("Error inserting/updating parking lot data", err);
        } else {
          console.log(`Parking lot data for ${lotId} inserted/updated successfully.`);
        }
      });
    });
  });
};


// Invoke the connectToDatabase function to start the process
connectToDatabase();

// POST endpoint to receive parking lot data and write it to the database
app.post('/parking-lot', (req, res) => {
  const { lotId, fullness, taps } = req.body;

  if (lotId == null || fullness == null || taps == null) {
    return res.status(400).send('Missing data for lotId, fullness, or availability');
  }

  const query = `INSERT INTO parking_lots (lot_id, fullness, taps) VALUES (?, ?, ?)`;

  dbConnection.query(query, [lotId, fullness, taps], (err, result) => {
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
    return res.status(400).json({message: 'Missing data for parkingLotId or availabilityValue'});
  }

  const checkQuery = `SELECT lot_id FROM parking_lots WHERE lot_id = ?`;

  dbConnection.query(checkQuery, [parkingLotId], (err, result) => {
    if (err) {
      console.error('Error checking for parking lot existence:', err);
      return res.status(500).json({message: 'Failed to check parking lot existence'});
    }

    if (result.length === 0) {
      const insertQuery = `INSERT INTO parking_lots (lot_id, fullness, taps) VALUES (?, ?, 0)`;

      dbConnection.query(insertQuery, [parkingLotId, availabilityValue], (err, insertResult) => {
        if (err) {
          console.error('Failed to insert new parking lot:', err);
          return res.status(500).json({message: 'Failed to insert new parking lot'});
        }

        console.log('New parking lot added successfully:', insertResult);
        res.status(200).json({message: 'New parking lot added and availability data updated successfully'});
      });
    } else {
      const updateQuery = `UPDATE parking_lots SET fullness = ? WHERE lot_id = ?`;

      dbConnection.query(updateQuery, [availabilityValue, parkingLotId], (err, updateResult) => {
        if (err) {
          console.error('Failed to update availability data:', err);
          return res.status(500).json({message: 'Failed to update availability data'});
        }

        console.log('Availability data updated successfully:', updateResult);
        res.status(200).json({message: 'Availability data updated successfully'});
      });
    }
  });
});



app.post('/submitTapsData', (req, res) => {
  console.log('posted')
  const { parkingLotId, tapsValue } = req.body;

  if (parkingLotId == null || tapsValue == null) {
    return res.status(400).send({message: 'missing data'});
  }

  const query = `UPDATE parking_lots SET taps = ? WHERE lot_id = ?`;

  dbConnection.query(query, [tapsValue, parkingLotId], (err, result) => {
    if (err) {
      console.error('Failed to update taps data:', err);
      return res.status(500).send({message: 'failed to update taps data'});
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
