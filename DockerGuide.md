# Docker Setup Guide for Node.js and MySQL Project

This guide provides step-by-step instructions for setting up a Docker environment for a Node.js application with a MySQL database.

## Prerequisites

- Docker installed on your development machine. You can download Docker from [Docker's website](https://www.docker.com/get-started).

## Installation

Pull the Dockerfile and docker-compose.yml

## Running the application

`docker compose up`

You might need to run it with sudo

`sudo docker compose up`

## Accessing Your Application

- The Node.js application will be accessible at http://localhost:3000.
- The MySQL database will be accessible on the default MySQL port 3306.

## Notes

- Ensure your Node.js application connects to MySQL using the host `db`.