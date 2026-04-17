import { Review } from "../Models/Review.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Product } from "../Models/Product.js";
import mongoose from "mongoose";

export const addOrUpdateReview = asyncHandler(async (req, res) => {
    try {
        const { product_id, rating, headline, review_description } = req.body;
        const user_id = req.user.id;

        // Check existing review
        let review = await Review.findOne({ product_id, user_id });

        if (review) {
            // Update
            review.rating = rating;
            review.headline = headline;
            review.review_description = review_description;
            await review.save();
        } else {
            // Create
            await Review.create({
                product_id,
                user_id,
                rating,
                headline,
                review_description,
            });
        }

        // 🔥 Recalculate average rating
        const stats = await Review.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(product_id) } },
            {
                $group: {
                    _id: "$product_id",
                    avgRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                },
            },
        ]);

        await Product.findByIdAndUpdate(product_id, {
            averageRating: stats[0]?.avgRating || 0,
            totalReviews: stats[0]?.totalReviews || 0,
        });

        return res.status(200).json(new ApiResponse("Review submitted successfully"));

    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json(new ApiError("You already reviewed this product"));
        }

        return res.status(500).json(new ApiError(error.message));
    }
});

export const getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const reviews = await Review.find({ product_id: productId })
        .populate("user_id", "name email") // show user info
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(reviews, "Reviews fetched successfully")
    )


});

export const getUserReviews = asyncHandler(async (req, res) => {
    // const userId = req.user.id;
    const { userId } = req.params;

    const reviews = await Review.find(userId)
        .populate("product_id", "name price")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(reviews, "Reviews fetched successfully")
    )
});
