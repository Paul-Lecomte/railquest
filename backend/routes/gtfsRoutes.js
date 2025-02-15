const express = require('express');
const router = express.Router();
const gtfsController = require('../controllers/gtfsController');

router.post('/update-gtfs', gtfsController.updateGTFS)

module.exports = router;