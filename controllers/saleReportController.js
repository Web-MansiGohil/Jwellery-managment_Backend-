import { salesAggregation } from "../utils/aggregateFunction.js";
import { Order } from "../Models/Order.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";


export const getSalesReport = async (req, res) => {
    try {
        const now = new Date();

        // Daily
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);

        const currentTime = new Date();

        // Monthly
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = currentTime;

        // Yearly
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = currentTime;

        const [daily, monthly, yearly] = await Promise.all([
            salesAggregation({ order_date: { $gte: dayStart, $lte: currentTime } }),
            salesAggregation({ order_date: { $gte: monthStart, $lte: monthEnd } }),
            salesAggregation({ order_date: { $gte: yearStart, $lte: yearEnd } })
        ]);

        return res.status(200).json(new ApiResponse({ daily, monthly, yearly }, "Sales Report fetched successfully"));
    } catch (error) {
        throw new ApiError(error.message);
    }
};

export const exportCSV = async (req, res) => {
    try {
        const now = new Date();
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);

        const currentTime = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        // 1. Fetch Summary Stats
        const [daily, monthly, yearly] = await Promise.all([
            salesAggregation({ order_date: { $gte: dayStart, $lte: currentTime } }),
            salesAggregation({ order_date: { $gte: monthStart, $lte: currentTime } }),
            salesAggregation({ order_date: { $gte: yearStart, $lte: currentTime } })
        ]);

        // 2. Fetch Detailed Delivered Orders
        const detailedOrders = await Order.find({ order_status: "Delivered" })
            .populate("userId", "username email phonenumber")
            .sort({ order_date: -1 });

        // 3. Build CSV String
        let csv = "SUMMARY STATISTICS\n";
        csv += "Period,Total Sales,Total Orders\n";
        csv += `Daily,"₹${daily.totalSales || 0}",${daily.totalOrders || 0}\n`;
        csv += `Monthly,"₹${monthly.totalSales || 0}",${monthly.totalOrders || 0}\n`;
        csv += `Yearly,"₹${yearly.totalSales || 0}",${yearly.totalOrders || 0}\n\n`;

        csv += "DETAILED ORDER RECORDS\n";
        csv += "Order ID,Date,Customer,Contact,Amount,Status\n";

        if (detailedOrders.length > 0) {
            detailedOrders.forEach(order => {
                const date = order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : "N/A";
                const customer = order.userId?.username || "Guest";
                const contact = order.userId?.phonenumber || order.userId?.email || "N/A";
                csv += `${order._id},${date},"${customer}","${contact}","₹${order.total_amount || 0}",${order.order_status}\n`;
            });
        } else {
            csv += "No delivered records found,,,,, \n";
        }

        // 4. Send File
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        return res.status(200).send(csv);

    } catch (error) {
        console.error("Export CSV Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};