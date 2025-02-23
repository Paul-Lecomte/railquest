const raptorService = require('../services/raptorService');
const asyncHandler = require('express-async-handler');

const getFastestRoute = asyncHandler(async (req, res) => {
    try {
        const { origin_id, destination_id, departure_time } = req.query;
        const result = await raptorService.findFastestRoute(origin_id, destination_id, departure_time);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error running RAPTOR algorithm', error: err });
    }
})

module.exports = {
    getFastestRoute,
}