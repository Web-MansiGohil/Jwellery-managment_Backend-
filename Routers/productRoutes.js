import express from 'express';
const router = express.Router();
import * as productController from '../Controllers/productController.js';
import { tokenVerify, adminOnly } from '../Middleware/authMiddleware.js';
import { upload } from '../Middleware/multerMidleware.js';

// POST /api/products/add-product (Admin Only)
router.post('/add-product', tokenVerify, adminOnly, upload.fields([{ name: 'images', maxCount: 5 }]), productController.createProduct);

// GET /api/products
router.get('/', productController.getProducts);

// GET /api/products/search
router.get('/search', productController.searchProducts);

// GET /api/products/:id
router.get('/:id', productController.getProductById);

// PUT /api/products/update/:id (Admin Only)
router.put('/update/:id', tokenVerify, adminOnly, upload.fields([{ name: 'images', maxCount: 5, minCount: 1 }]), productController.updateProduct);

// DELETE /api/products/delete/:id (Admin Only)
router.delete('/delete/:id', tokenVerify, adminOnly, productController.deleteProduct);

export default router;
