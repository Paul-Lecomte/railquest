const fs = require('fs');
const axios = require('axios');
const path = require('path');
const unzipper = require('unzipper');
const { promisify } = require('util');
const { parse } = require('csv-parse');
const stream = require('stream');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Agency = require('../models/agencyModel');
const Calendar = require('../models/calendarModel');
const CalendarDate = require('../models/calendarDatesModel');
const FeedInfo = require('../models/feedInfoModel');
const Route = require('../models/routesModel');
const StopTime = require('../models/stopTimesModel');
const Stop = require('../models/stopsModel');
const Transfer = require('../models/transfersModel');
const Trip = require('../models/tripsModel');

const pipeline = promisify(stream.pipeline);

const DATA_DIR = path.join(__dirname, 'gtfs_data');
const ZIP_FILE_PATH = path.join(DATA_DIR, 'gtfs.zip');
const GTFS_BASE_URL = 'https://data.opentransportdata.swiss/en/dataset/timetable-2025-gtfs2020';

// Ensure the data directory exists
if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DATA_DIR, { recursive: true });

// Function to get the latest GTFS download link
async function getLatestGTFSLink() {
    console.log('Fetching latest GTFS data link...');
    try {
        const response = await axios.get(GTFS_BASE_URL);
        const $ = cheerio.load(response.data);

        const latestLink = $('a[href*="download/gtfs_fp2025_"]').attr('href');
        if (!latestLink) throw new Error('No GTFS download link found');

        const fullUrl = new URL(latestLink, GTFS_BASE_URL).href;
        console.log('Latest GTFS data URL:', fullUrl);
        return fullUrl;
    } catch (error) {
        console.error('Error fetching latest GTFS link:', error);
        throw error;
    }
}

// Function to download GTFS dataset
async function downloadGTFS() {
    console.log('Downloading GTFS data...');
    try {
        const latestGTFSLink = await getLatestGTFSLink();
        const response = await axios({ url: latestGTFSLink, method: 'GET', responseType: 'stream' });
        await pipeline(response.data, fs.createWriteStream(ZIP_FILE_PATH));
        console.log('Download complete.');
    } catch (error) {
        console.error('Error downloading GTFS data:', error);
    }
}

// Function to extract GTFS ZIP file
async function extractGTFS() {
    console.log('Extracting GTFS data...');
    try {
        const directory = await unzipper.Open.file(ZIP_FILE_PATH);

        await Promise.all(directory.files.map(file => {
            return new Promise((resolve, reject) => {
                file.stream()
                    .pipe(fs.createWriteStream(path.join(DATA_DIR, file.path)))
                    .on('finish', resolve)
                    .on('error', reject);
            });
        }));

        console.log('GTFS data extracted successfully');

    } catch (error) {
        console.error('Error extracting GTFS data:', error);
    }
}

// Function to parse a specific GTFS CSV file using streaming
async function parseCSV(fileName, model, name) {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        console.log(`File ${fileName} not found, skipping...`);
        return;
    }

    console.log(`Processing ${fileName}...`);

    return new Promise((resolve, reject) => {
        const batchSize = 100;
        let batch = [];
        let processingQueue = Promise.resolve(); // Ensures batch insertions are awaited

        const readStream = fs.createReadStream(filePath);
        const parser = parse({
            columns: true,
            relax_column_count: true,
            skip_empty_lines: true,
        });

        parser.on('data', (data) => {
            batch.push(data);
            if (batch.length >= batchSize) {
                const currentBatch = [...batch]; // Copy current batch
                batch = []; // Reset batch

                processingQueue = processingQueue.then(() =>
                    saveGTFSData(model, currentBatch, name)
                ).catch(reject); // Ensure errors propagate
            }
        });

        parser.on('end', async () => {
            if (batch.length > 0) {
                await processingQueue; // Wait for all previous batches
                await saveGTFSData(model, batch, name);
            } else {
                await processingQueue; // Ensure last batch completes
            }
            console.log(`Finished processing ${fileName}.`);
            resolve();
        });

        parser.on('error', (err) => {
            console.error(`Error parsing ${fileName}:`, err);
            reject(err);
        });

        readStream.pipe(parser);
    });
}

// Function to save GTFS data into MongoDB
async function saveGTFSData(model, data, name) {
    if (!data.length) return;

    try {
        console.log(`Clearing existing data in ${name} collection...`);
        await model.deleteMany({});

        console.log(`Inserting ${data.length} records into DB collection...`);
        await model.insertMany(data, { ordered: false});
        console.log(`Inserted ${data.length} records into DB.`);
    } catch (error) {
        console.error(`Error saving ${name}:`, error);
    }
}

// Main function to handle the GTFS data process
async function updateGTFSData() {
    await downloadGTFS();
    await extractGTFS();

    const filesToParse = {
        'agency.txt': { model: Agency, name: 'Agency' },
        'calendar.txt': { model: Calendar, name: 'Calendar' },
        'calendar_dates.txt': { model: CalendarDate, name: 'Calendar Dates' },
        'feed_info.txt': { model: FeedInfo, name: 'Feed Info' },
        'routes.txt': { model: Route, name: 'Routes' },
        'stop_times.txt': { model: StopTime, name: 'Stop Times' },
        'stops.txt': { model: Stop, name: 'Stops' },
        'transfers.txt': { model: Transfer, name: 'Transfers' },
        'trips.txt': { model: Trip, name: 'Trips' }
    };

    for (const [file, { model, name }] of Object.entries(filesToParse)) {
        try {
            await parseCSV(file, model, name);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }

    console.log('GTFS data update completed.');
}

// Run the script
updateGTFSData()
    .then(() => {
        console.log('GTFS data update finished successfully.');
        mongoose.connection.close();
        process.exit(0);
    })
    .catch(err => {
        console.error('Error updating GTFS data:', err);
        mongoose.connection.close();
        process.exit(1);
    });