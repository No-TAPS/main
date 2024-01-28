const express = require('express');
const mysql = require('mysql2');

// Create a connection to the database
const dbConnection = mysql.createConnection({
  host: 'localhost', // or 'db' if you are using docker-compose
  user: 'root', // your database username
  password: 'yourpassword', // your database password
  database: 'mydb' // your database name
});

// Connect to the MySQL server
dbConnection.connect(err => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  console.log('Connected to database with ID: ' + dbConnection.threadId);
});

// Create an Express application
const app = express();

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the Express server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
