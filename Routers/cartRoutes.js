import express from 'express';
import * as cartController from '../controllers/cartController.js';
import { tokenVerify } from '../Middleware/authMiddleware.js';

const router = express.Router();
//@api
//dec : get all cart
//method: POST
//endpoint : /api/cart/
router.get('/', tokenVerify, cartController.getCart);

//@api
//dec : add item to cart
//method: POST
//endpoint : /api/cart/add
router.post('/add-cart', tokenVerify, cartController.addItemToCart);

//@api
//dec : update item quantity
//method: PUT
//endpoint : /api/cart/update/:id
router.put('/update/:id', tokenVerify, cartController.updateItemQuantity);

//@api
//dec : remove item from cart
//method: DELETE
//endpoint : /api/cart/remove/:productId
router.delete('/remove/:productId', tokenVerify, cartController.removeItemFromCart);

//@api
//dec : clear cart
//method: DELETE
//endpoint : /api/cart/clear
router.delete('/clear', tokenVerify, cartController.clearCart);

export default router;
