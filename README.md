# cloudstorage

A simple web application for uploading and storing files using Node.js, Express, Multer, Firebase Admin SDK, and MongoDB.

## Description

This application allows users to upload files (images, videos, or audios) to the server. Each uploaded file is stored in Firebase Storage, and related data (such as file count, links, etc.) is stored in MongoDB.

## Key Features

- Uploading files (images, videos, or audios) to the server.
- Storing uploaded files in Firebase Storage.
- Storing related data (file count, links, etc.) in MongoDB.
- Periodically removing expired links.

## Installation

1. Make sure you have Node.js and MongoDB installed on your machine.
2. Clone this repository to your machine.
3. Navigate to the project directory and run `npm install` command to install dependencies.
4. Ensure you have the Firebase configuration file (`firebase-data.json`) corresponding to your Firebase settings.

## Usage

1. Run the server with `npm start` command.
2. Open your browser and navigate to `http://localhost:7861`.
3. Upload the files you want to store on the server.

## Contribution

Contributions are always welcome. To contribute, please open an issue for feature suggestions or a pull request for enhancements you'd like to make.