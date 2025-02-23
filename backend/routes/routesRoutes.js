const express = require('express');
const { getAllRoutes } = require('../controllers/routesController');
const router = express.Router();

router.get('/all', getAllRoutes);

module.exports = router;