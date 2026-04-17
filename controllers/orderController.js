import { Order } from '../Models/Order.js';
import { OrderItem } from '../Models/OrderItem.js';
import { Cart } from '../Models/Cart.js';
import { Notification } from '../Models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { aggregationFunction } from '../utils/aggregateFunction.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate Invoice PDF
export const generateInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`Generating EXACT MATCH invoice for Order: ${id}`);

    // 1. Fetch Order with populated data
    const order = await Order.findById(id)
        .populate("userId", "name email first_name last_name username")
        .populate("Address_id");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.Address_id) {
        throw new ApiError(400, "Shipping address not found. Please update address first.");
    }

    // 2. Authorization
    if (req.user.role !== 'Admin' && order.userId._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to download this invoice");
    }

    // 3. Fetch Items
    const orderItems = await OrderItem.find({ orderId: id }).populate("productId");
    if (!orderItems || orderItems.length === 0) {
        throw new ApiError(400, "No products found for this order");
    }

    // 4. Create PDF Document
    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
    doc.pipe(res);

    // --- Design Config ---
    const blackHeader = "#1a1a1a";
    const goldAccent = "#c5a059";
    const lightGray = "#f4f4f4";
    const serifBold = "Times-Bold";
    const sansRegular = "Helvetica";
    const sansBold = "Helvetica-Bold";

    // --- Header Section (Black Canvas) ---
    doc.rect(0, 0, 595.28, 115).fill(blackHeader);

    // Left Branding
    doc.fillColor("#ffffff").font(sansBold).fontSize(32).text("RADHE", 40, 35);
    doc.fillColor(goldAccent).font(sansBold).fontSize(14).text("IMITATIONS & JEWELS", 40, 72);
    doc.fillColor("#ffffff").font(sansRegular).fontSize(8).text("Premium Jewellery & Fashion Accessories", 40, 92);

    // Right Contact Details
    doc.fillColor("#ffffff").font(sansRegular).fontSize(8);
    const rightX = 400;
    doc.text("Office No. 502, Diamond Plaza,", rightX, 35, { align: 'right', width: 155 });
    doc.text("Varachha Main Road,", rightX, 45, { align: 'right', width: 155 });
    doc.text("Surat, Gujarat - 395006", rightX, 55, { align: 'right', width: 155 });
    doc.text("Phone: +91 98765 43210", rightX, 65, { align: 'right', width: 155 });
    doc.text("Email: support@radhejewels.com", rightX, 75, { align: 'right', width: 155 });

    // Gold Divider
    doc.rect(0, 115, 595.28, 6).fill(goldAccent);

    // --- Metadata & Billed To ---
    let y = 145;
    doc.fillColor(blackHeader).font(sansBold).fontSize(20).text("INVOICE", 40, y);

    // Invoice Info (Left)
    doc.font(sansRegular).fontSize(9).fillColor("#333333");
    doc.text(`Order ID: ${order._id}`, 40, y + 25);
    doc.text(`Date: ${new Date(order.order_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 40, y + 40);
    doc.text(`Status: ${order.order_status.toUpperCase()}`, 40, y + 55);

    // Billed To (Right Box)
    const boxX = 335, boxW = 220, boxH = 80;
    doc.rect(boxX, y, boxW, boxH).fill(lightGray);
    doc.fillColor(blackHeader).font(sansBold).fontSize(10).text("BILLED TO", boxX + 15, y + 10);

    const addr = order.Address_id;
    const clientName = addr.name || `${order.userId.first_name || ''} ${order.userId.last_name || order.userId.username || 'Valued Client'}`;
    doc.font(sansBold).fontSize(9).text(clientName.toUpperCase(), boxX + 15, y + 25);
    doc.font(sansRegular).fontSize(8).fillColor("#555555").text(`User ID: ${order.userId._id}`, boxX + 15, y + 36);
    doc.text(addr.address.toUpperCase(), boxX + 15, y + 47, { width: 190 });
    doc.text(`${addr.city.toUpperCase()} - ${addr.pincode}`, boxX + 15, y + 58);

    // --- Product Table ---
    y = 250;
    doc.rect(40, y, 515, 25).fill(blackHeader);
    doc.fillColor("#ffffff").font(sansBold).fontSize(8);
    doc.text("ITEM DESCRIPTION", 50, y + 8);
    doc.text("PRODUCT ID", 210, y + 8, { width: 120, align: 'center' });
    doc.text("QTY", 330, y + 8, { width: 40, align: 'center' });
    doc.text("PRICE", 380, y + 8, { width: 80, align: 'right' });
    doc.text("TOTAL", 475, y + 8, { width: 65, align: 'right' });

    y += 25;
    orderItems.forEach((item, index) => {
        const prod = item.productId || {};
        const title = (prod.name || prod.title || "Jewellery Piece");
        const prodId = (prod._id.toString().slice(-8).toUpperCase());

        doc.fillColor("#333333").font(sansRegular).fontSize(9).text(title, 50, y + 10);

        // Show item discount if present
        if (item.discount > 0) {
            doc.fillColor("#2e7d32").fontSize(7).text(`(Disc: -Rs. ${item.discount.toLocaleString('en-IN')} ${item.couponCode || ''})`, 50, y + 21);
            doc.fillColor("#333333").fontSize(9); // Reset
        }

        doc.text(`CODE: ${prodId}`, 210, y + 10, { width: 120, align: 'center' });
        doc.text(item.quantity.toString(), 330, y + 10, { width: 40, align: 'center' });
        doc.text(item.price.toLocaleString('en-IN'), 380, y + 10, { width: 80, align: 'right' });
        doc.text((item.price * item.quantity).toLocaleString('en-IN'), 475, y + 10, { width: 65, align: 'right' });

        y += 25;
        doc.moveTo(40, y).lineTo(555, y).strokeColor("#eeeeee").lineWidth(0.5).stroke();
    });

    // --- Financial Summary ---
    y += 15;
    doc.fillColor("#555555").font(sansRegular).fontSize(9);
    doc.text("SUBTOTAL:", 400, y, { width: 80, align: 'right' });
    doc.fillColor(blackHeader).text(`Rs. ${order.subtotal.toLocaleString('en-IN')}`, 480, y, { width: 75, align: 'right' });

    // Smart Discount Detection for all orders (new and old)
    let finalDiscount = order.discount || 0;
    if (finalDiscount === 0) {
        // Fallback: If total is less than (subtotal + delivery) * 1.03 (tax), we have a discount
        const expectedGross = Math.round((order.subtotal + (order.delivery_charge || 0)) * 1.03);
        if (expectedGross > order.total_amount + 5) {
            finalDiscount = Math.round((expectedGross - order.total_amount) / 1.03);
        }
    }

    if (finalDiscount > 0) {
        y += 20;
        doc.fillColor("#555555").text("TOTAL DISCOUNT:", 370, y, { width: 110, align: 'right' });
        doc.fillColor("#2e7d32").font(sansBold).text(`- Rs. ${finalDiscount.toLocaleString('en-IN')}`, 480, y, { width: 75, align: 'right' });
        doc.font(sansRegular);
    }

    y += 20;
    doc.fillColor("#555555").text("DELIVERY CHARGES:", 370, y, { width: 110, align: 'right' });
    doc.fillColor(blackHeader).text(`Rs. ${order.delivery_charge || 0}`, 480, y, { width: 75, align: 'right' });

    // taxAmt = total - (subtotal - discount + delivery)
    const discountVal = order.discount || 0;
    const deliveryVal = order.delivery_charge || 0;
    const taxAmt = Math.round(order.total_amount - (order.subtotal - discountVal + deliveryVal));

    if (taxAmt > 0) {
        y += 20;
        doc.fillColor("#555555").text("TAX (3% GST):", 400, y, { width: 80, align: 'right' });
        doc.fillColor(blackHeader).text(`Rs. ${taxAmt.toLocaleString('en-IN')}`, 480, y, { width: 75, align: 'right' });
    }

    y += 20;
    doc.rect(380, y, 175, 35).fill(goldAccent);
    doc.fillColor("#ffffff").font(sansBold).fontSize(11).text("TOTAL AMOUNT:", 395, y + 12);
    doc.fontSize(12).text(`Rs. ${order.total_amount.toLocaleString('en-IN')}`, 465, y + 11, { width: 80, align: 'right' });

    // --- Final Footer Message (Inside Black Line) ---
    doc.rect(0, 810, 595.28, 31).fill(blackHeader);
    doc.fillColor("#ffffff").font(sansBold).fontSize(8)
        .text("THANK YOU FOR CHOOSING RADHE JEWELS! WE HOPE OUR CRAFTSMANSHIP ADDS A SPARKLE TO YOUR LIFE. VISIT US AGAIN SOON!", 0, 822, { align: 'center', width: 595 });

    doc.end();
});
// Place new order

export const createOrder = asyncHandler(async (req, res) => {
    // 1. Get user cart
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
        return res.status(400).json(
            new ApiResponse({}, "Cart is empty")
        )
    }
    console.log(cart);

    // 2. Calculate subtotal
    let subtotal = 0;
    for (const item of cart.items) {
        const product = item.productId;

        if (product.stock < item.quantity) {
            throw new ApiError("Product is out of stock")
        }

        product.stock -= item.quantity;
        await product.save();
        subtotal += product.price * item.quantity;
    }

    // 3. Extra calculations
    const discount = req.body.discount || 0; // Dynamic from applied coupons via frontend payload
    const couponCode = cart.items.find(item => item.couponCode)?.couponCode || null;
    const delivery_charge = 0; // Match frontend logic (Free Delivery)
    const tax = Math.round(subtotal * 0.03); // Match frontend logic (3% GST)

    // Ensure total amount is calculated correctly (discount applied before tax if it was item-level, 
    // but here we follow the frontend total subtraction which is safer for the sum)
    const total_amount = subtotal - discount + delivery_charge + Math.round((subtotal - discount) * 0.03);

    const { Address_id } = req.body;

    // 4. Create Order
    const order = new Order({
        userId: req.user.id,
        subtotal,
        discount,
        couponCode,
        delivery_charge,
        total_amount,
        Address_id
    });

    await order.save();
    const finalOrder = await Order.findById(order._id)
        .populate({ path: "userId", select: "-password -token -first_name -last_name -role -createdAt -updatedAt -__v -is_staff -is_deactive" })
        .populate({ path: "Address_id", select: "-createdAt -updatedAt -__v" });


    // 5. Create OrderItems
    const orderItems = cart.items.map(item => ({
        orderId: order._id,
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
        discount: item.appliedDiscount || 0,
        couponCode: item.couponCode || null
    }));

    await OrderItem.insertMany(orderItems);


    // 6. Clear cart
    cart.items = [];
    await cart.save();

    return res.status(201).json(
        new ApiResponse({ order: finalOrder, orderItems }, "Order created successfully")
    )

});
// Get user orders (Order History)
export const getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const orders = await Order.find({ userId })
        .populate({
            path: "userId",
            select: "-password -token -first_name -last_name -role -createdAt -updatedAt -__v -is_staff -is_deactive"
        })
        .populate({
            path: "Address_id",
            select: "-createdAt -updatedAt -__v"
        })
        .sort({ createdAt: -1 }); // latest first

    return res.status(200).json(
        new ApiResponse(orders, "User orders fetched successfully")
    );
});

// Admin: Get all orders
export const getAllOrders = asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate({ path: "userId", select: "-password -token -first_name -last_name -role -createdAt -updatedAt -__v -is_staff -is_deactive" })
            .populate({ path: "Address_id", select: "-createdAt -updatedAt -__v" })
            .sort({ createdAt: -1 });
        return res.status(200).json(new ApiResponse(orders, "Orders fetched successfully"));
    } catch (err) {
        throw new ApiError(err.message);
    }
});

// Get single order by ID (Admin/User)
export const getOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findById(id)
        .populate({ path: "userId", select: "-password -token -first_name -last_name -role -createdAt -updatedAt -__v -is_staff -is_deactive" })
        .populate({ path: "Address_id", select: "-createdAt -updatedAt -__v" });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Fetch items separately since they are in another collection
    const items = await OrderItem.find({ orderId: id }).populate("productId");

    return res.status(200).json(new ApiResponse({ ...order._doc, items }, "Order fetched successfully"));
});

// Admin: Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    try {
        const { order_status } = req.body;

        if (!order_status) {
            return res.status(400).json({ success: false, message: "Order status is required" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: { order_status: order_status } },
            { new: true, runValidators: true }
        )
            .populate({ path: "userId", select: "-password -token -first_name -last_name -role -createdAt -updatedAt -__v -is_staff -is_deactive" })
            .populate({ path: "Address_id", select: "-createdAt -updatedAt -__v" });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Create notification for the user
        await Notification.create({
            message: `Order #${order._id.toString().slice(-6)} update: Your order is now ${order_status}!`,
            type: 'Order',
            targetType: 'Private',
            userId: order.userId._id,
            link: `/orders/history`
        });

        return res.status(200).json(new ApiResponse({ order }, "Order updated successfully"));
    } catch (err) {
        console.error("DEBUG ORDER STATUS FIX:", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to update order status" });
    }
});

//order cancel
export const cancelOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
        throw new ApiError("Order not found");
    }

    // ❌ Don't allow cancel if already delivered or cancelled
    if (order.order_status === "Delivered") {
        throw new ApiError("Delivered order cannot be cancelled");
    }

    if (order.order_status === "Cancelled") {
        throw new ApiError("Order already cancelled");
    }

    // ❌ Optional: prevent cancel after shipped
    if (order.order_status === "Shipped") {
        throw new ApiError("Shipped order cannot be cancelled");
    }

    // ✅ Update status
    order.order_status = "Cancelled";
    await order.save();

    res.status(200).json(new ApiResponse({ order }, "Order cancelled successfully"));
});
