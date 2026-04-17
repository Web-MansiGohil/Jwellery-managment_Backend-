import express from "express";
import { getSalesReport, exportCSV } from "../controllers/saleReportController.js";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { tokenVerify, adminOnly } from "../Middleware/authMiddleware.js";


const router = express.Router()

// admin only
//dec : sale report 
//Metod : get
//endpoint  : /api/report/sale-report
router.get("/sale-report", tokenVerify, adminOnly, getSalesReport)

// Metod : get
// endpoint : /api/report/export-csv
router.get("/export-csv", tokenVerify, adminOnly, exportCSV)

// dashboard stats
// endpoint : /api/report/dashboard-stats
router.get("/dashboard-stats", getDashboardStats)

export default router
