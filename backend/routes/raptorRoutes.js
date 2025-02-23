const express = require('express');
const { getFastestRoute } = require('../controllers/raptorController');
const router = express.Router();

router.get('/fastest-route', getFastestRoute);

module.exports = router;