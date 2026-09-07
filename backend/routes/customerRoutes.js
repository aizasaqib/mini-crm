const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all customer routes with auth middleware
router.use(authMiddleware);

// CRUD routes for customers
router.post('/', customerController.createCustomer);
router.get('/', customerController.getCustomers);
router.get('/:id/purchases', customerController.getCustomerPurchases);
router.post('/:id/purchases', customerController.createCustomerPurchase);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
