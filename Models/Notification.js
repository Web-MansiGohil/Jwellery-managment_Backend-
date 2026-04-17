import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['Coupon', 'Order', 'System'],
        default: 'System'
    },
    targetType: {
        type: String,
        enum: ['Global', 'Private'],
        default: 'Private'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() { return this.targetType === 'Private'; }
    },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

export const Notification = mongoose.model('Notification', notificationSchema);
