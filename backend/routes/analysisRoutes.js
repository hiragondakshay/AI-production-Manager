const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/generate', analysisController.generateReport);
router.get('/report', analysisController.getReport);
router.get('/pdf', analysisController.downloadPDF);
const chatbotController = require('../controllers/chatbotController');
router.post('/chat', chatbotController.chat);

module.exports = router;
