import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order_date: { type: Date, default: Date.now },
  subtotal: { type: Number, required: true },
  // discount_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
  Address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
  delivery_charge: { type: Number },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  total_amount: { type: Number, required: true },
  order_status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  is_deactive: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
}, {
  timestamps: true
});

export const Order = mongoose.model('Order', orderSchema);