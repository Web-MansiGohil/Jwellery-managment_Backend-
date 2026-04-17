import express from "express";
import { removeBackground, detectJewelryDetails, virtualTryOn, chatWithJewelryExpert } from "../Controllers/aiController.js";

const router = express.Router();

// @api POST /api/ai/remove-background
router.post("/remove-background", removeBackground);

// @api POST /api/ai/detect-jewelry-details
router.post("/detect-jewelry-details", detectJewelryDetails);

// @api POST /api/ai/virtual-try-on
router.post("/virtual-try-on", virtualTryOn);

// @api POST /api/ai/chat
router.post("/chat", chatWithJewelryExpert);

export default router;
