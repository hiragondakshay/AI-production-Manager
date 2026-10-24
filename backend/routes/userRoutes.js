const express = require('express');
const router = express.Router();
const userDataController = require('../controllers/userDataController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware); // Protect all routes

router.get('/data', userDataController.getUserData);
router.post('/profile', userDataController.saveProfile);
router.post('/vitals', userDataController.saveVitals);
router.post('/symptoms', userDataController.saveSymptoms);
router.post('/reasons', userDataController.saveReasons);
router.get('/history', userDataController.getHistory);
router.put('/update-profile', userDataController.updateProfile);

module.exports = router;
