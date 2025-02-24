const raptorService = require('../services/raptorService');
const asyncHandler = require('express-async-handler');

const getFastestRoute = asyncHandler(async (req, res) => {
    const { origin_id, destination_id, departure_time } = req.query;

    if (!origin_id || !destination_id || !departure_time) {
        return res.status(400).json({ message: 'origin_id, destination_id, and departure_time are required.' });
    }

    try {
        const result = await raptorService.findFastestRoute(origin_id, destination_id, departure_time);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error running RAPTOR algorithm', error: err.message });
    }
});

module.exports = {
    getFastestRoute,
};