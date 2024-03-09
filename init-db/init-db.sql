CREATE DATABASE IF NOT EXISTS parkingLots;
USE parkingLots;

CREATE TABLE IF NOT EXISTS parking_lots (
        lot_id INT PRIMARY KEY,
        fullness INT NOT NULL,
        taps INT NOT NULL
      );

CREATE USER IF NOT EXISTS 'No-Taps'@'%' IDENTIFIED BY 'Taps';
GRANT ALL PRIVILEGES ON parkingLots.* TO 'No-Taps'@'%';
FLUSH PRIVILEGES;
