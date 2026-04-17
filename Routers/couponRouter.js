import express from 'express';
import {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    applyCoupon
} from '../Controllers/couponController.js';
import { tokenVerify, adminOnly } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes

// Public/User routes
//endpoint: /api/coupons/all
router.get('/all', getAllCoupons);
//endpoint: /api/coupons/:id
router.get('/:id', getCouponById);
//endpoint: /api/coupons/apply
router.post('/apply', applyCoupon);

// Admin only routes
//endpoint: /api/coupons/add-coupons
router.post('/add-coupons', tokenVerify, adminOnly, createCoupon);
//endpoint: /api/coupons/update/:id
router.put('/update/:id', tokenVerify, adminOnly, updateCoupon);
//endpoint: /api/coupons/delete/:id
router.delete('/delete/:id', tokenVerify, adminOnly, deleteCoupon);

export default router;