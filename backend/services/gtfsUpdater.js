const fs = require('fs');
const axios = require('axios');
const path = require('path');
const unzipper = require('unzipper');
const { promisify } = require('util');
const { parse } = require('csv-parse');
const stream = require('stream');
const cheerio = require('cheerio');

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

        // Find the latest download link
        const latestLink = $('a[href*="download/gtfs_fp2025_"]').attr('href');

        if (!latestLink) {
            throw new Error('No GTFS download link found');
        }

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

        const response = await axios({
            url: latestGTFSLink,
            method: 'GET',
            responseType: 'stream',
        });

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

        fs.readdir(DATA_DIR, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);
            } else {
                console.log('Extracted files:', files);
            }
        });

    } catch (error) {
        console.error('Error extracting GTFS data:', error);
    }
}

// Function to parse a specific GTFS CSV file
function parseCSV(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    const results = [];
    let skippedRows = 0;

    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath);

        let firstChunk = true;

        readStream
            .pipe(parse({
                columns: (header) => header.map(column => column.replace(/^\ufeff/, '')),
                relax_column_count: true,
                relax_quotes: true,
                skip_empty_lines: true,
                skip_lines_with_error: true,
                quote: '"',
                escape: '\\',
            }))
            .on('data', (data) => {
                if (firstChunk) {
                    data = Object.keys(data).reduce((acc, key) => {
                        const cleanedKey = key.replace(/^\ufeff/, '');
                        const cleanedValue = data[key].replace(/^\ufeff/, '');
                        acc[cleanedKey] = cleanedValue;
                        return acc;
                    }, {});
                    firstChunk = false;
                }
                results.push(data);
            })
            .on('end', () => {
                console.log(`Parsing ${fileName} complete. Skipped ${skippedRows} rows.`);
                resolve(results);
            })
            .on('error', (err) => {
                console.error('CSV Parsing Error:', err);
                reject(err);
            });
    });
}

// Main function to handle the GTFS data process
async function updateGTFSData() {
    await downloadGTFS();
    await extractGTFS();

    const filesToParse = [
        'agency.txt', 'calendar.txt', 'calendar_dates.txt', 'feed_info.txt',
        'routes.txt', 'stop_times.txt', 'stops.txt', 'transfers.txt', 'trips.txt'
    ];

    for (const file of filesToParse) {
        try {
            const parsedData = await parseCSV(file);
            console.log(`Parsed ${file}:`, parsedData.slice(0, 1));
        } catch (error) {
            console.error(`Error parsing ${file}:`, error);
        }
    }
}

// Run the script
updateGTFSData().catch(console.error);