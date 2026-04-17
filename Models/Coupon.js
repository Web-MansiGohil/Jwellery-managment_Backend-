import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    discount_id: { type: Number, unique: true }, // Keeping the field as requested
    discount_name: { type: String, required: true, maxlength: 100 },
    discount_type: {
        type: String,
        enum: ['Percentage', 'Flat'],
        required: true
    },
    discount_value: { type: Number, required: true },
    start_date: { type: Date},
    end_date: { type: Date},
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false }
}, {
    timestamps: true
});

export const Coupon = mongoose.model('Coupon', couponSchema);