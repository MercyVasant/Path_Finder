const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routingController');

router.post('/get-path', routingController.getPath);

module.exports = router;
