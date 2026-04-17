import { createPaymentIntent, verifyPayment, getAllPayments, getPaymentHistory, getPaymentById, updatePaymentStatus } from "../Controllers/paymentController.js";
import { tokenVerify, adminOnly } from '../Middleware/authMiddleware.js';
import express from "express";

const router = express.Router();

//@api
//des : payment create
//method : POST
//endpoint : /api/payment/create-order
router.post("/create-order", createPaymentIntent);

//@api
//des : payment verify
//method : POST
//endpoint : /api/payment/verify-payment
router.post("/verify-payment", verifyPayment);

//@api
//des : get all payments
//method : GET
//endpoint : /api/payment/all-payments
router.get("/all-payments", getAllPayments);

//@api
//des : get payment history
//method : GET
//endpoint : /api/payment/payment-history
router.get("/payment-history", getPaymentHistory);

//@api
//des : get payment by id
//method : GET
//endpoint : /api/payment/:id
router.get("/:id", getPaymentById);

//update payment status
// @api
// des : update payment status
// method : PUT
// endpoint : /api/payment/update-status/:id
router.patch("/update-status/:id", tokenVerify, adminOnly, updatePaymentStatus);

export default router;