import express from "express";
import { createSubcategory, deleteSubcategory, getAllSubcategories, getSubcategoryById, updateSubcategory } from "../Controllers/subcategoryController.js";
import { tokenVerify, adminOnly } from "../Middleware/authMiddleware.js";

const router = express.Router();

//@router
//desc Create Subcategory
//method : POST
//endpoint : /api/subcategory/add-subcategory
router.post("/add-subcategory", tokenVerify, adminOnly, createSubcategory);

//@router
//desc Get All Subcategories
//method : GET
//endpoint : /api/subcategory/
router.get("/", getAllSubcategories);

//@router
//desc Get Subcategory By Id
//method : GET
//endpoint : /api/subcategory/:id
router.get("/:id", getSubcategoryById);

//@router
//desc Update Subcategory
//method : PUT
//endpoint : /api/subcategory/update/:id
router.put("/update/:id", tokenVerify, adminOnly, updateSubcategory);

//@router
//desc Delete Subcategory
//method : DELETE
//endpoint : /api/subcategory/delete/:id
router.delete("/delete/:id", tokenVerify, adminOnly, deleteSubcategory)

export default router;

