const { exec } = require('child_process');  // To execute the gtfsUpdater.js script
const path = require('path');
const asyncHandler = require('express-async-handler');

// Define the path to your gtfsUpdater.js file
const gtfsUpdaterPath = path.join(__dirname, '../gtfsUpdater.js');

const updateGTFS = async (req, res) => {
    try {
        // Execute the gtfsUpdater.js script
        exec(`node ${gtfsUpdaterPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send({ message: 'Failed to update GTFS data', error: stderr });
            }
            console.log(`stdout: ${stdout}`);
            res.status(200).send({ message: 'GTFS data updated successfully', output: stdout });
        });
    } catch (err) {
        console.error('Error updating GTFS data:', err);
        res.status(500).send({ message: 'Failed to update GTFS data', error: err.message });
    }
}

module.exports =  {
    updateGTFS,
}