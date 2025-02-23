const express = require('express');
const { getTripsByRoute } = require('../controllers/tripsController')
const router = express.Router();

router.get('/:route_id', getTripsByRoute);

module.exports = router;