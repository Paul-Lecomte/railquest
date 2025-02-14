const fs = require('fs');
const axios = require('axios');
const path = require('path');
const unzipper = require('unzipper');
const { promisify } = require('util');
const { parse } = require('csv-parse');
const stream = require('stream');

const pipeline = promisify(stream.pipeline);

const DATA_DIR = path.join(__dirname, 'gtfs_data'); // Directory to store GTFS data
const ZIP_FILE_PATH = path.join(DATA_DIR, 'gtfs.zip'); // Path for downloaded ZIP file

// Ensure the data directory exists
if (fs.existsSync(DATA_DIR)) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DATA_DIR, { recursive: true });

// Function to download GTFS dataset
async function downloadGTFS() {
    console.log('Downloading GTFS data...');
    try {
        const response = await axios({
            url: 'https://data.opentransportdata.swiss/dataset/6cca1dfb-e53d-4da8-8d49-4797b3e768e3/resource/e05e656b-18b5-4df6-87e8-c9b38fae7352/download/gtfs_fp2025_2025-02-13.zip',
            method: 'GET',
            responseType: 'stream',
        });

        await pipeline(response.data, fs.createWriteStream(ZIP_FILE_PATH)); // Fix: Wait for download completion
        console.log('Download complete.');
    } catch (error) {
        console.error('Error downloading GTFS data:', error);
    }
}

// Function to extract GTFS ZIP file
async function extractGTFS() {
    console.log('Extracting GTFS data...');
    try {
        // Open the zip file and extract to the gtfs_data directory
        const directory = await unzipper.Open.file(ZIP_FILE_PATH);

        // Extract all files inside the ZIP to the DATA_DIR
        await Promise.all(directory.files.map(file => {
            return file.stream().pipe(fs.createWriteStream(path.join(DATA_DIR, file.path)));
        }));

        console.log('GTFS data extracted successfully');

        // Log the contents of the directory to debug the structure
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

// Function to parse a specific GTFS CSV file (example: stops.txt)
function parseCSV(fileName) {
    const filePath = path.join(DATA_DIR, fileName);
    const results = [];
    let skippedRows = 0;

    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath);

        let firstChunk = true;

        readStream
            .pipe(parse({
                columns: (header) => {
                    // Remove BOM from headers as well
                    return header.map(column => column.replace(/^\ufeff/, ''));
                },
                relax_column_count: true,
                relax_quotes: true, // Allow lenient handling of quotes
                skip_empty_lines: true,
                skip_lines_with_error: true, // Skip lines that contain errors
                quote: '"', // Set quoting character to handle it better
                escape: '\\', // Set escape character to handle escaped quotes
            }))
            .on('data', (data) => {
                // Remove BOM from all keys and values in the row
                if (firstChunk) {
                    data = Object.keys(data).reduce((acc, key) => {
                        const cleanedKey = key.replace(/^\ufeff/, ''); // Remove BOM from key
                        const cleanedValue = data[key].replace(/^\ufeff/, ''); // Remove BOM from value
                        acc[cleanedKey] = cleanedValue;
                        return acc;
                    }, {});
                    firstChunk = false;
                }
                results.push(data);
            })
            .on('end', () => {
                console.log(`Parsing complete. Skipped ${skippedRows} rows.`);
                resolve(results);
            })
            .on('error', (err) => {
                console.error('CSV Parsing Error:', err);
                // Handling quote errors by skipping the problematic row and continuing parsing
                if (err.code === 'CSV_QUOTE_NOT_CLOSED') {
                    skippedRows += 1;
                    console.warn(`Skipping row due to unclosed quote at line ${err.line}`);
                    return;  // Continue parsing despite the error
                }
                reject(err);
            });
    });
}

// Main function to handle the GTFS data process
async function updateGTFSData() {
    await downloadGTFS(); // Step 1: Download the data
    await extractGTFS();  // Step 2: Extract the ZIP file

    // Step 3: Check the directory structure to ensure 'stops.txt' is in the correct location
    const stops = await parseCSV('stops.txt');
    console.log('Parsed stops:', stops.slice(0, 5)); // Print first 5 records for verification

    // Parse other relevant files
    const routes = await parseCSV('routes.txt');
    console.log('Parsed routes:', routes.slice(0, 5)); // Print first 5 records for verification

    const trips = await parseCSV('trips.txt');
    console.log('Parsed trips:', trips.slice(0, 5)); // Print first 5 records for verification
}

// Run the script
updateGTFSData().catch(console.error);