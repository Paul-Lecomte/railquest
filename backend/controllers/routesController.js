const asyncHandler = require('express-async-handler');
const Route = require('../models/routesModel');

const getAllRoutes = asyncHandler(async (req, res) => {
    try {
        const routes = await Route.find();
        res.status(200).json(routes);
    } catch (err){
        res.status(500).json({message:'Error fetching routes', err: err});
    }
})

module.exports = {
    getAllRoutes,
}