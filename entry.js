const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

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
