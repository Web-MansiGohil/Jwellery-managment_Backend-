import express from 'express';
import { tokenVerify } from '../Middleware/authMiddleware.js';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';

const router = express.Router();
// @route 
// @desc : get wishlist
//methos: GET
// @endpoint : /api/wishlist/
router.get('/', tokenVerify, getWishlist);

// @route 
// @desc : add to wishlist
//methos: POST
// @endpoint : /api/wishlist/add-wishlist
router.post('/add-wishlist', tokenVerify, addToWishlist);

// @route 
// @desc : remove from wishlist
//methos: DELETE
// @endpoint : /api/wishlist/:productId
router.delete('/:productId', tokenVerify, removeFromWishlist);

export default router;
