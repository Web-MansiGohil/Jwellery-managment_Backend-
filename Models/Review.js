import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  headline: { type: String },
  review_description: { type: String },
  images: { type: String },

}, { timestamps: true });

export const Review = mongoose.model('Review', reviewSchema);