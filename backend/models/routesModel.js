const mongoose = require("mongoose");

const routesSchema = new mongoose.Schema({
    route_id: String,
    agency_id: String,
    route_short_name: String,
    route_long_name: String,
    route_desc: String,
    route_type: String,
});

module.exports = mongoose.model("Routes", routesSchema);