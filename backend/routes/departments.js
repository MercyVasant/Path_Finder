const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// GET all departments
router.get('/', departmentController.getDepartments);

// GET a single department by ID
router.get('/:id', departmentController.getDepartmentById);

// **NEW ROUTE**
// This is the new endpoint to get all faculty members for a specific department.
router.get('/:id/faculty', departmentController.getDepartmentFaculty);

module.exports = router;