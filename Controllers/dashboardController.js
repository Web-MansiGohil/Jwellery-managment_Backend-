import { Payment } from "../Models/Payment.js";
import { User } from "../Models/User.js";
import { Appointment } from "../Models/Appointment.js";
import { Product } from "../Models/Product.js";
import { Order } from "../Models/Order.js";
import { Coupon } from "../Models/Coupon.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [
        todayPayments,
        totalStats,
        customersCount,
        bookingsCount,
        totalUsersCount,
        totalProductsCount,
        lowStockCount,
        outOfStockCount,
        inventoryStats,
        categoryPerformance,
        deliveredOrders,
        cancelledOrders,
        activeOrders,
        todayAppointments,
        activeCoupons,
        totalCoupons
    ] = await Promise.all([
        // Today Revenue
        Payment.aggregate([
            {
                $match: {
                    payment_status: "success",
                    payment_date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]),
        // Total Revenue
        Payment.aggregate([
            {
                $match: {
                    payment_status: "success"
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" }
                }
            }
        ]),
        // Active Customers (Only is_active: true)
        User.countDocuments({ role: "Customer", is_active: true }),
        // Active Bookings (Not Cancelled)
        Appointment.countDocuments({ status: { $ne: "Cancelled" } }),
        // Global User Stats (Total Customers)
        User.countDocuments({ role: "Customer" }),
        // Global Product Stats
        Product.countDocuments(),
        Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
        Product.countDocuments({ stock: { $lte: 0 } }),
        Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ["$price", "$stock"] } },
                    totalStock: { $sum: "$stock" },
                    totalProductPriceSum: { $sum: "$price" }
                }
            }
        ]),
        // Category Performance Data
        Product.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            { $unwind: "$category" },
            {
                $group: {
                    _id: "$category.name",
                    count: { $sum: 1 }
                }
            }
        ]),
        // Order Stats
        Order.countDocuments({ order_status: "Delivered" }),
        Order.countDocuments({ order_status: "Cancelled" }),
        Order.countDocuments({ order_status: { $nin: ["Delivered", "Cancelled"] } }),
        // Today's Appointments
        Appointment.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay }
        }),
        // Coupon Stats
        Coupon.countDocuments({ is_active: true }),
        Coupon.countDocuments()
    ]);

    const stats = {
        todayRevenue: todayPayments[0]?.total || 0,
        totalRevenue: totalStats[0]?.total || 0,
        activeCustomers: customersCount,
        activeBookings: bookingsCount,
        totalUsersCount: totalUsersCount,
        totalProductsCount: totalProductsCount,
        globalLowStock: lowStockCount,
        globalOutOfStock: outOfStockCount,
        totalInventoryValue: inventoryStats[0]?.totalValue || 0,
        totalProductPriceSum: inventoryStats[0]?.totalProductPriceSum || 0,
        totalStockCount: inventoryStats[0]?.totalStock || 0,
        categoryPerformance: categoryPerformance || [],
        deliveredOrdersCount: deliveredOrders,
        cancelledOrdersCount: cancelledOrders,
        activeOrdersCount: activeOrders,
        todayAppointmentsCount: todayAppointments,
        activeCouponsCount: activeCoupons,
        totalCouponsCount: totalCoupons,
    };

    return res.status(200).json(new ApiResponse(stats, "Dashboard stats fetched successfully"));
});
