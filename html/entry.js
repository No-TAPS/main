// Importing required modules
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

// Creating an Express application
const app = express();

// Port for the server
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors()); 

// Functions for json file reading
app.get('/ParkingCordsJson', (req, res) => {
    const path = './parking_data.json'; 
    const file = fs.createReadStream(path);
    file.pipe(res);
});

// OLD Function
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

// Name of the database
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

      const createTableQuery = `CREATE TABLE IF NOT EXISTS parking_lots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lot_id VARCHAR(255) NOT NULL,
        fullness INT NOT NULL,
        taps INT NOT NULL,
        last_updated TIMESTAMP DEFAULT NULL,
        UNIQUE lot_id_unique (lot_id)
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
// Route to insert new parking lot data
app.post('/parking-lot', (req, res) => {
  // Destructure required fields from the request body
  const { lotId, fullness, taps } = req.body;

  // Validate presence of all required fields
  if (lotId == null || fullness == null || taps == null) {
    // Respond with 400 status if any field is missing
    return res.status(400).send('Missing data for lotId, fullness, or availability');
  }

  // SQL query to insert new parking lot data
  const query = `INSERT INTO parking_lots (lot_id, fullness, taps) VALUES (?, ?, ?)`;

  // Execute the query against the database
  dbConnection.query(query, [lotId, fullness, taps], (err, result) => {
    if (err) {
      // Log and respond with error message if query execution fails
      console.error('Failed to write parking lot data:', err);
      return res.status(500).send('Failed to write parking lot data');
    }
    // Log success and send a 201 response with message and insert ID
    console.log("Parking lot data written successfully:", result);
    res.status(201).send({ message: 'Parking lot data written successfully', id: result.insertId });
  });
});

// Route to submit or update parking lot availability data
app.post('/submitAvailabilityData', (req, res) => {
  // Destructure required fields from the request body
  const { parkingLotId, availabilityValue } = req.body;

  // Validate presence of all required fields
  if (parkingLotId == null || availabilityValue == null) {
    // Respond with 400 status if any field is missing
    return res.status(400).json({ message: 'Missing data for parkingLotId or availabilityValue' });
  }

  // SQL query to check existence of the parking lot
  const checkQuery = `SELECT lot_id FROM parking_lots WHERE lot_id = ?`;

  // Execute the check query against the database
  dbConnection.query(checkQuery, [parkingLotId], (err, result) => {
    if (err) {
      // Log and respond with error message if check query execution fails
      console.error('Error checking for parking lot existence:', err);
      return res.status(500).json({ message: 'Failed to check parking lot existence' });
    }

    if (result.length === 0) {
      // SQL query to insert new parking lot if it does not exist
      const insertQuery = `INSERT INTO parking_lots (lot_id, fullness, taps) VALUES (?, ?, 0)`;

      // Execute the insert query
      dbConnection.query(insertQuery, [parkingLotId, availabilityValue], (err, insertResult) => {
        if (err) {
          // Log and respond with error message if insert operation fails
          console.error('Failed to insert new parking lot:', err);
          return res.status(500).json({ message: 'Failed to insert new parking lot' });
        }

        // Log success and respond with 200 status and success message
        console.log('New parking lot added successfully:', insertResult);
        res.status(200).json({ message: 'New parking lot added and availability data updated successfully' });
      });
    } else {
      // SQL query to update existing parking lot's availability
      const updateQuery = `UPDATE parking_lots SET fullness = ? WHERE lot_id = ?`;

      // Execute the update query
      dbConnection.query(updateQuery, [availabilityValue, String(parkingLotId)], (err, updateResult) => {
        if (err) {
          // Log and respond with error message if update operation fails
          console.error('Failed to update availability data:', err);
          return res.status(500).json({ message: 'Failed to update availability data' });
        }

        // Log success and respond with 200 status and success message
        console.log('Availability data updated successfully:', updateResult);
        res.status(200).json({ message: 'Availability data updated successfully' });
      });
    }
  });
});



// Handle submission of taps data via POST request
app.post('/submitTapsData', (req, res) => {
  // Debugging
  console.log('posted');

  // Destructuring request body to extract required data
  const { parkingLotId, tapsValue, currentTimestamp } = req.body;

  if (parkingLotId == null || tapsValue == null || currentTimestamp == null) {
      return res.status(400).send({ message: 'missing or invalid data' });
  }

  try {
      // Parsing timestamp to ensure it's in the correct format
      const formattedTimestamp = new Date(currentTimestamp);

      // Checking if the parsed timestamp is valid
      if (isNaN(formattedTimestamp.getTime())) {
          return res.status(400).send({ message: 'Invalid timestamp format' });
      }

      // SQL query to update taps data for the specified parking lot
      const query = 'UPDATE parking_lots SET taps = ?, last_updated = ? WHERE lot_id = ?';

      // Executing the SQL query with provided data
      dbConnection.query(query, [tapsValue, formattedTimestamp, String(parkingLotId)], (err, result) => {
          if (err) {
              console.error('Failed to update taps data:', err);
              return res.status(500).send({ message: 'Failed to update taps data', error: err.message });
          }

          // Logging success message if update is successful
          console.log('Taps data updated successfully:', result);
          res.status(200).send({ message: 'Taps data updated successfully' });
      });
  } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).send({ message: 'Internal server error' });
  }
});


// Get parking lot data by lotId
app.get('/parking-lot/:lotId', (req, res) => {

    // Extracting lotId from request parameters
    const lotId = req.params.lotId;
    
    // SQL query to select parking lot data based on lotId
    const query = 'SELECT * FROM parking_lots WHERE lot_id = ?';

    // Executing the SQL query with the provided lotId
    dbConnection.query(query, [lotId], (err, results) => {
        if (err) {
            console.error('Failed to retrieve parking lot data:', err);
            return res.status(500).send('Failed to retrieve parking lot data');
        }

        // If parking lot data is found, sending 200 status with the first data
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
