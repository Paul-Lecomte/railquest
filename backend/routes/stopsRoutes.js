const express = require('express');
const { getAllStops } = require('../controllers/stopsController');

const router = express.Router();

router.get('/allStops', getAllStops);

module.exports = router;