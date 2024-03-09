CREATE DATABASE IF NOT EXISTS your_database_name;
USE your_database_name;

CREATE TABLE IF NOT EXISTS parking_lots (
    lot_id INT PRIMARY KEY,
    fullness INT NOT NULL,
    taps BOOLEAN NOT NULL
);
