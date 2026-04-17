import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        headline: {
            type: String,
            maxlength: 200,
            trim: true,
        },
        review_description: {
            type: String,
        },
        media: [
            {
                type: String, // multiple images/videos
            },
        ],
    },
    { timestamps: true }
);

reviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);