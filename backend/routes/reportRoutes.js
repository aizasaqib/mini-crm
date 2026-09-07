const express = require('express');
const router  = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware   = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/reports — returns aggregated CRM stats
router.get('/', reportController.getReport);

module.exports = router;
