const fs = require('fs');
const axios = require('axios');
const path = require('path');
const zlib = require('zlib');
const stream = require('stream');
const { promisify } = require('util');
const { parse } = require('csv-parse');

const pipeline = promisify(stream.pipeline);

// URL of the GTFS dataset
const GTFS_URL = 'https://opentransportdata.swiss/dataset/fahrplan-2025-gtfs2020/download';
const DATA_DIR = path.join(__dirname, 'gtfs_data'); // Directory to store GTFS data
const ZIP_FILE_PATH = path.join(DATA_DIR, 'gtfs.zip'); // Path for downloaded ZIP file

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Function to download GTFS dataset
async function downloadGTFS() {
    console.log("Downloading GTFS...");
    try {
        const response = await axios({
            url: GTFS_URL,
            method: 'GET',
            responseType: 'stream',
        });

        await pipeline(response.data, fs.createWriteStream(ZIP_FILE_PATH));
        console.log("Download complete.");
    } catch (error) {
        console.log("Error downloading GTFS...");
    }
}

// Function to extract GTFS ZIP file
async function extractGTFS(){
    console.log("Extracting GTFS...");
    const unzip = zlib.createGunzip();
    const readStream = fs.createReadStream(ZIP_FILE_PATH);
    const writeStream = fs.createWriteStream(DATA_DIR);

    try {
        await pipeline(readStream, unzip, writeStream);
        console.log("GTFS data extracted successfully")
    } catch (error) {
        console.log("Error extracting GTFS Data");
    }
}