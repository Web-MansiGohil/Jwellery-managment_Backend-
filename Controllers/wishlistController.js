import { Wishlist } from '../Models/Wishlist.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Product } from '../Models/Product.js';

// Get User Wishlist
export const getWishlist = asyncHandler(async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ userId: req.user.id }).populate('productId');
        return res.status(200).json(
            new ApiResponse(wishlist, "Wishlist fetched successfully")
        )
    } catch (err) {
        return res.status(500).json(
            new ApiError("Server error", err.message)
        )
    }
});

// Add to Wishlist
export const addToWishlist = asyncHandler(async (req, res) => {

    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json(
            new ApiResponse({}, "Product not found")
        );
    }
    let wishlistItem = await Wishlist.findOne({ userId: req.user.id, productId: product });

    if (wishlistItem) {
        return res.status(400).json(
            new ApiResponse({}, "Product already in wishlist")
        );
    }

    wishlistItem = new Wishlist({ userId: req.user.id, productId: product });
    await wishlistItem.save();

    return res.status(201).json(
        new ApiResponse(wishlistItem, "Product added to wishlist successfully")
    );
});

// Remove from Wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
    try {
        const { productId } = req.params;
        await Wishlist.findOneAndDelete({ userId: req.user.id, productId });
        return res.status(200).json(
            new ApiResponse({}, "Product removed from wishlist successfully")
        )
    } catch (err) {
        return res.status(500).json(
            new ApiError("Server error", err.message)
        )
    }
});
