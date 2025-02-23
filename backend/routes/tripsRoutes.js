const express = require('express');
const { getTripsByRoute } = require('../controllers/tripsController')
const router = express.Router();

router.get('/all', getTripsByRoute);

module.exports = router;