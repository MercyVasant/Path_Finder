const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');

router.get('/search', buildingController.searchBuildings);
router.get('/', buildingController.getBuildings);
router.get('/:id', buildingController.getBuildingById);

module.exports = router;