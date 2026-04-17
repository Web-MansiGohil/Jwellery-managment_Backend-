import express from 'express';
import * as orderController from '../Controllers/orderController.js';
import { adminOnly, tokenVerify } from '../Middleware/authMiddleware.js';

const router = express.Router();

// @route   
// POST 
// /api/orders/add-order
router.post('/add-order', tokenVerify, orderController.createOrder);

// @route   
// GET 
// /api/orders/user
router.get('/user', tokenVerify, orderController.getUserOrders);

// @route  
//  GET
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);

// @route   
// PUT 
// /api/orders/:id/status (Admin Only)
router.put('/:id/status', tokenVerify, adminOnly, orderController.updateOrderStatus);

// @route  
//  DELETE
//  /api/orders/:id/cancel 
router.delete('/:id/cancel', tokenVerify, orderController.cancelOrder);

// @route   
// GET 
// /api/orders/:id/invoice
router.get('/:id/invoice', tokenVerify, orderController.generateInvoice);

export default router;
