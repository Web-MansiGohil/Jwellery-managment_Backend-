import { Cart } from "../Models/Cart.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../Models/Product.js";
import { Coupon } from "../Models/Coupon.js";
import mongoose from "mongoose";

// Add item to cart
export const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, couponCode, appliedDiscount } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError("Product not found");
  }

  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new ApiError("Invalid Product ID");
  }
  if (quantity <= 0) {
    throw new ApiError("Invalid quantity");
  }

  let cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    cart = new Cart({ 
      userId: req.user.id, 
      items: [{ productId, quantity, couponCode, appliedDiscount: appliedDiscount || 0 }] 
    });
  } else {
    const itemIndex = cart.items.findIndex((p) => {
      if (!p.productId) return false;
      const idStr = p.productId._id ? p.productId._id.toString() : p.productId.toString();
      return idStr === productId;
    });

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
      if (couponCode) {
        cart.items[itemIndex].couponCode = couponCode;
        cart.items[itemIndex].appliedDiscount = appliedDiscount || 0;
      }
    } else {
      cart.items.push({ productId, quantity, couponCode, appliedDiscount: appliedDiscount || 0 });
    }
  }
  await cart.save();
  await cart.populate("items.productId");
  return res
    .status(200)
    .json(new ApiResponse(cart, "Item added to cart successfully"));
});

// Get user cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id }).populate(
    "items.productId",
  );

  if (!cart) {
    cart = await Cart.create({ userId: req.user.id, items: [] });
    return res.status(200).json(new ApiResponse(cart, "Cart fetched successfully"));
  }

  // 🔥 RE-VALIDATE COUPONS
  let changed = false;
  const now = new Date();

  for (let item of cart.items) {
    if (item.couponCode) {
      const coupon = await Coupon.findOne({
        discount_name: item.couponCode,
        is_active: true,
        is_deleted: false
      });

      // Check if coupon exists, is active, and if dates match (if they exist)
      let isValid = !!coupon;
      if (coupon) {
        if (coupon.start_date && coupon.start_date > now) isValid = false;
        if (coupon.end_date && coupon.end_date < now) isValid = false;
      }

      if (!isValid) {
        item.couponCode = null;
        item.appliedDiscount = 0;
        changed = true;
      }
    }
  }

  if (changed) {
    await cart.save();
    // Re-populate to ensure clean data
    await cart.populate("items.productId");
  }

  return res
    .status(200)
    .json(new ApiResponse({ 
      ...cart.toObject(), 
      coupon_notice: changed ? "Some expired or inactive coupons were removed from your bag." : null 
    }, "Cart fetched successfully"));
});

// Remove item from cart
export const removeItemFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  let cart = await Cart.findOne({ userId: req.user.id });
  if (cart) {
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId,
    );
    await cart.save();
    cart = await Cart.findOne({ userId: req.user.id }).populate(
      "items.productId",
    );
    return res
      .status(200)
      .json(new ApiResponse(cart, "Item removed from cart successfully"));
  }
  throw new ApiError("Cart not found");
});

// Update item quantity
export const updateItemQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { id: productId } = req.params;

  if (!productId) {
    throw new ApiError("Product ID is required");
  }
  let cart = await Cart.findOne({ userId: req.user.id });

  const itemIndex = cart.items.findIndex(
    (p) => p.productId.toString() === productId
  );

  if (itemIndex === -1) {
    throw new ApiError("Item not in cart");
  }

  if (quantity <= 0) {
    cart.items = cart.items.filter((item) => {
      if (!item.productId) return false;

      return item.productId._id
        ? item.productId._id.toString() !== productId
        : item.productId.toString() !== productId;
    });
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  await cart.save();
  await cart.populate("items.productId");

  return res
    .status(200)
    .json(new ApiResponse(cart, "Item quantity updated successfully"));
});

export const clearCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user.id });

  if (!cart) {
    throw new ApiError("Cart not found");
  }

  cart.items = [];

  await cart.save();

  return res
    .status(200)
    .json(new ApiResponse(cart, "Cart cleared successfully"));
});
