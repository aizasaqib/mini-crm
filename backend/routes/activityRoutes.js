const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all activity routes
router.use(authMiddleware);

// CRUD routes for activities
router.post('/', activityController.createActivity);
router.get('/', activityController.getActivities);
router.get('/:id', activityController.getActivityById);
router.put('/:id', activityController.updateActivity);
router.delete('/:id', activityController.deleteActivity);

module.exports = router;
