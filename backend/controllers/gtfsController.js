const { exec } = require('child_process');  // To execute the gtfsUpdater.js script
const path = require('path');

// Define the path to your gtfsUpdater.js file
const gtfsUpdaterPath = path.join(__dirname, '../gtfsUpdater.js');