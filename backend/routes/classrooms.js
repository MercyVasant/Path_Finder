
const router = require('express').Router();
const classroomController = require('../controllers/classroomController');

router.get('/', classroomController.getClassrooms);

module.exports = router;
