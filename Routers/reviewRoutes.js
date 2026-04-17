import express from "express";
import { addOrUpdateReview, getProductReviews, getUserReviews } from "../Controllers/rateController.js";
import { tokenVerify } from "../Middleware/authMiddleware.js";
import { upload } from "../Middleware/multerMidleware.js";

const router = express.Router();

//@api
//method : POST
//Desc : add review to product
//end point : /api/reviews/add-review
router.post("/add-review", tokenVerify, upload.single("images"), addOrUpdateReview);

//@api
//method : GET
//Desc : get product reviews
//end point : /api/reviews/product-reviews/:productId
router.get("/product-reviews/:productId", getProductReviews);

//@api
//method : GET
//Desc : get user reviews
//end point : /api/reviews/user-reviews/:userId
router.get("/user-reviews", getUserReviews);

export default router;