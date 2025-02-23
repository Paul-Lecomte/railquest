const asyncHandler = require("express-async-handler");
const Trip = require('../models/tripsModel');

const getTripsByRoute = asyncHandler(async (req, res) => {
    try{
        const { route_id } = req.params;
        const trips = await Trip.find({ route_id });
        res.status(200).json(trips);
    } catch (err){
        res.status(500).json({message:'Error fetching trips',error: err});
    }
})

module.exports = {
    getTripsByRoute,
}