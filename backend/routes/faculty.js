const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');

// Search faculty by name
router.get('/search', facultyController.searchFaculty);

// This route is now specifically for getting the details of a single faculty member.
router.get('/:id', facultyController.getFacultyById);

// We no longer need the GET '/' route to fetch all faculty at once.
module.exports = router;