import express from 'express';
const router = express.Router();
import * as categoryController from '../controllers/categoryController.js';
import { adminOnly, tokenVerify } from '../Middleware/authMiddleware.js';

// @route   POST /api/categories/add-category
router.post('/add-category', tokenVerify, adminOnly, categoryController.createCategory);

// @route   GET /api/categories
router.get('/', categoryController.getCategories);

router.get('/:id', categoryController.getCategoryById);

// @route   PUT /api/categories/:id
router.put('/update/:id', tokenVerify, adminOnly, categoryController.updateCategory);

// @route   DELETE /api/categories/:id
router.delete('/delete/:id', tokenVerify, adminOnly, categoryController.deleteCategory);

export default router;
