import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./Routers/authRoutes.js";
import categoryRoutes from "./Routers/categoryRoutes.js";
import subCategoryRoutes from "./Routers/subCategoryRoutes.js";
import productRoutes from "./Routers/productRoutes.js";
import cartRoutes from "./Routers/cartRoutes.js";
import wishlistRoutes from "./Routers/wishlistRoutes.js";
import orderRoutes from "./Routers/orderRoutes.js";
import addressRoutes from "./Routers/addressRoutes.js";
import paymentRoutes from "./Routers/paymentRoutes.js";
import reportRoutes from "./Routers/saleReportRoutes.js";
import couponRoutes from "./Routers/couponRouter.js";
import appointmentRoutes from "./Routers/appointmentRoutes.js";
import reviewRoutes from "./Routers/reviewRoutes.js";
import timeSlotRoutes from "./Routers/timeSlotRoutes.js";
import notificationRoutes from "./Routers/notificationRoutes.js";
import aiRoutes from "./Routers/aiRoutes.js";
import "./cron/couponCron.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./Middleware/errorMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "view"));
app.use(express.static("public"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.urlencoded({ extended: true }));

// app.use((req, res, next) => {
//   console.log(`API Called: ${req.method} ${req.url}`);
//   next();
// });

// Routes
app.use("/api", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategory", subCategoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);

// // Basic Route
app.get("/", (req, res) => {
  res.render("index", { key: process.env.RAZORPAY_KEY_ID });
});

app.use(errorHandler);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

// Triggering nodemon restart to pick up PORT 8002 from .env
