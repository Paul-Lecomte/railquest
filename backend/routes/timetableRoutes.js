const express = require('express');
const { getTimeTableForStop } = require('../controllers/timeTableController')
const router = express.Router();

router.get('/:stop_id', getTimeTableForStop);

module.exports = router;