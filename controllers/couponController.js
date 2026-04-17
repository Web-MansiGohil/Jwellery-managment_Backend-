import { Coupon } from '../Models/Coupon.js';
import { Notification } from '../Models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Helper function to auto-deactivate expired coupons
const deactivateExpiredCoupons = async () => {
    try {
        const now = new Date();
        const result = await Coupon.updateMany(
            {
                is_active: true,
                is_deleted: false,
                end_date: { $lt: now }
            },
            { $set: { is_active: false } }
        );
        if (result.modifiedCount > 0) {
            console.log(`Auto-deactivated ${result.modifiedCount} expired coupons.`);
        }
    } catch (error) {
        console.error("Error auto-deactivating coupons:", error);
    }
};


// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Admin
const createCoupon = asyncHandler(async (req, res) => {
    const { discount_name, discount_type, discount_value, start_date, end_date, is_active } = req.body;

    if (!discount_name || !discount_type || !discount_value) {
        throw new ApiError("Name, type and value are required");
    }

    // Simple discount_id auto-increment
    const lastCoupon = await Coupon.findOne().sort({ discount_id: -1 });
    const discount_id = lastCoupon ? lastCoupon.discount_id + 1 : 1;

    const coupon = await Coupon.create({
        discount_id,
        discount_name,
        discount_type,
        discount_value,
        start_date,
        end_date,
        is_active: is_active !== undefined ? is_active : true
    });

    // Create Notification for users
    const discountStr = discount_type === 'Percentage' ? `${discount_value}%` : `₹${discount_value}`;
    await Notification.create({
        message: `New Offer! Use coupon "${discount_name}" to get ${discountStr} discount!`,
        type: 'Coupon',
        targetType: 'Global'
    });

    return res.status(201).json(
        new ApiResponse(coupon, "Coupon created successfully")
    );
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  User/Admin
const getAllCoupons = asyncHandler(async (req, res) => {
    // Auto-deactivate any expired coupons before fetching
    await deactivateExpiredCoupons();

    // Return all coupons (Admin needs to see inactive ones to toggle them)
    // Users will filter for is_active on the frontend
    const coupons = await Coupon.find({ is_deleted: false });


    return res.status(200).json(
        new ApiResponse(coupons, "Coupons fetched successfully")
    );
});

// @desc    Get coupon by ID
// @route   GET /api/coupons/:id
// @access  Admin/User
const getCouponById = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
        throw new ApiError("Coupon not found");
    }

    return res.status(200).json(
        new ApiResponse(coupon, "Coupon fetched successfully")
    );
});

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Admin
const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!coupon) {
        throw new ApiError("Coupon not found");
    }

    return res.status(200).json(
        new ApiResponse(coupon, "Coupon updated successfully")
    );
});

// @desc    Delete coupon (Soft delete recommended, but user asked for CRUD)
// @route   DELETE /api/coupons/:id
// @access  Admin
const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
        throw new ApiError("Coupon not found");
    }

    return res.status(200).json(
        new ApiResponse({}, "Coupon deleted successfully")
    );
});

// @desc    Apply coupon benefit
// @route   POST /api/coupons/apply
// @access  User
const applyCoupon = asyncHandler(async (req, res) => {
    const { coupon_name, total_amount } = req.body;

    // Ensure we handle current expirations before application
    await deactivateExpiredCoupons();

    const query = {
        discount_name: coupon_name,
        is_active: true,
        is_deleted: false
    };

    const coupon = await Coupon.findOne(query);


    if (!coupon) {
        throw new ApiError("Invalid or expired coupon");
    }


    let discount_amount = 0;
    if (coupon.discount_type === 'Percentage') {
        discount_amount = (total_amount * coupon.discount_value) / 100;
    } else {
        discount_amount = coupon.discount_value;
    }

    const final_amount = total_amount - discount_amount;

    return res.status(200).json(
        new ApiResponse({
            discount_amount,
            final_amount,
            coupon_details: coupon
        }, "Coupon applied successfully")
    );
});

export {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    applyCoupon,
    deactivateExpiredCoupons
};