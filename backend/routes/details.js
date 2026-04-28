const express = require('express');
const router = express.Router();
const detailsController = require('../controllers/detailsController');

// This single endpoint efficiently fetches all campus data for the college details page.
router.get('/', detailsController.getCollegeDetails);

module.exports = router;