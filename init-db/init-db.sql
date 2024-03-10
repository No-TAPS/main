-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS parkingLots;
USE parkingLots;

-- Create the parking_lots table
CREATE TABLE IF NOT EXISTS parking_lots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lot_id VARCHAR(255) NOT NULL,
    fullness INT NOT NULL,
    taps INT NOT NULL,
    last_updated TIMESTAMP DEFAULT NULL,
    UNIQUE lot_id_unique (lot_id)
);

-- Create the user for updating taps
CREATE USER IF NOT EXISTS 'No-Taps'@'%' IDENTIFIED BY 'Taps';
GRANT ALL PRIVILEGES ON parkingLots.* TO 'No-Taps'@'%';
FLUSH PRIVILEGES;

-- Create the event to reset taps to 0 after one hour
CREATE EVENT IF NOT EXISTS reset_taps_event
ON SCHEDULE EVERY 1 MINUTE
DO
    UPDATE parking_lots SET taps = 0 WHERE TIMESTAMPDIFF(HOUR, COALESCE(last_updated, NOW()), NOW()) >= 1;


