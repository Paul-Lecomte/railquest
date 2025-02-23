const asyncHandler = require("express-async-handler");
const Stop = require("../models/stopsModel");

const getAllStops = asyncHandler(async (req, res) => {
    try {
        const { name } = req.query;
        const query = name ? { stop_name : {$regex: name, $options: 'i'}} : {};
        const stops = await Stop.find(query).limit(50);
        res.status(200).json({stops})
    } catch (err) {
        res.status(500).json({message: `Error getting stops list`, error: err});
    }
})

module.exports = {
    getAllStops,
}