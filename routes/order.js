const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/AuthVerifyMiddleware');

// Create new order (requires staff authentication)
router.post('/create', protect, orderController.createOrder);

// Get order details
router.get('/get/:id', protect, orderController.getOrderDetails);

// Update order status
router.patch('/update/:id', protect, orderController.updateOrderStatus);

module.exports = router;