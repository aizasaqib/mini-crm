const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', dealController.createDeal);
router.get('/', dealController.getDeals);
router.get('/:id', dealController.getDealById);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

module.exports = router;
