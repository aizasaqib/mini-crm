const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', settingsController.getProfile);
router.put('/', settingsController.updateProfile);
router.put('/password', settingsController.changePassword);

module.exports = router;
