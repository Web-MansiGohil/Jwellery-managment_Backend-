import { asyncHandler } from "../utils/asyncHandler.js";
import { Payment } from "../Models/Payment.js";
import { Order } from "../Models/Order.js";
import { razorpay } from "../config/razorpay.js";
import crypto from "crypto";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;

  const option = {
    amount: Math.round(amount * 100), // amount in paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };
  const paymentOrder = await razorpay.orders.create(option);
  console.log("paymentOrder", paymentOrder);

  const paymentInfo = await Payment.create({
    order_id: orderId, // The exact DB ObjectId coming from frontend
    razorpay_order_id: paymentOrder.id,
    amount: amount,
    payment_status: "pending",
    payment_method: "Online",
    payment_date: new Date(),
  });

  res.status(200).json({
    success: true,
    paymentInfo,
    paymentOrder,
    message: "Payment created successfully",
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { rezorpay_order_id, rezorpay_payment_id, rezorpay_signature } =
    req.body;

  console.log("rezorpay_order_id", rezorpay_order_id);
  console.log("rezorpay_payment_id", rezorpay_payment_id);
  console.log("rezorpay_signature", rezorpay_signature);

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = rezorpay_order_id + "|" + rezorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  const isValid = expectedSignature === rezorpay_signature;
  if (isValid) {
    const payment = await Payment.findOneAndUpdate(
      { razorpay_order_id: rezorpay_order_id },
      {
        payment_status: "success",
        razorpay_payment_id: rezorpay_payment_id,
        razorpay_signature: rezorpay_signature,
        payment_date: new Date(),
      },
      { new: true },
    );

    if (payment && payment.order_id) {
       await Order.findByIdAndUpdate(payment.order_id, { order_status: "Processing" });
    }

    return res
      .status(200)
      .json(new ApiResponse("Payment verified successfully"));
  } else {
    return res.status(400).json(new ApiResponse("Payment verification failed"));
  }
});

// get all payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(payments, "Payments fetched successfully"));
});

//get payment history
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ payment_status: "success" }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(payments, "Payment history fetched successfully"));
}
);

// get payment by id
export const getPaymentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findById(id);
  if (!payment) {
    return res.status(404).json(new ApiResponse("Payment not found"));
  }
  return res.status(200).json(new ApiResponse(payment, "Payment fetched successfully"));
});

// update payment status
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { payment_status } = req.body;
  const { id } = req.params;
  const payment = await Payment.findByIdAndUpdate(
    id,
    { payment_status },
    { new: true }
  );
  if (!payment) {
    return res.status(404).json(new ApiResponse("Payment not found"));
  }
  res.status(200).json(new ApiResponse(payment, "Payment status updated successfully"));
});