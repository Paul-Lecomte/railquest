const express = require('express');
const { getAllStops } = require('../controllers/stopsController');

const router = express.Router();

router.get('/all', getAllStops);

module.exports = router;