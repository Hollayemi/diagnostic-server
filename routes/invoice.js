const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Create invoice for an order
router.post('/create', invoiceController.create);

// Get invoice details
router.get('/get/:id', invoiceController.getOne);

// Record payment
router.post('/:id/payments', invoiceController.recordPayment);

// Generate receipt data
router.get('/:id/receipt', invoiceController.generateReceipt);

module.exports = router;