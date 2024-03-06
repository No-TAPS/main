# Use an official Node.js runtime as a base image
FROM node:lts-alpine3.19

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install any dependencies
RUN npm install express mysql2 body-parser

# Bundle your app's source code inside the Docker image
COPY ./html .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "entry.js" ]
