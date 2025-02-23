const asyncHandler = require("express-async-handler");
const StopTime = require('../models/stopTimesModel');

const getTimeTableForStop = asyncHandler(async (req, res) => {
    try {
        const { stop_id } = req.params;
        const timetable = await StopTime.find({ stop_id }).sort({ arrival_time: 1 });
        res.status(200).json(timetable);
    } catch (err){
        res.status(500).json({message: 'Error fetching time table', error: err});
    }
})

module.export = {
    getTimeTableForStop,
}