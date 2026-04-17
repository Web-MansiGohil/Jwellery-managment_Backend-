import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    delivery_person_name: { type: String, required: true },
    delivery_person_phone: { type: String, required: true },
    delivery_status: { type: String, enum: ['Pending', 'Out for Delivery', 'Delivered', 'Cancelled'], default: 'Pending' },
    delivery_date: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Delivery = mongoose.model('Delivery', deliverySchema);