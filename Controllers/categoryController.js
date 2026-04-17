import { Category } from '../Models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { aggregationFunction } from '../utils/aggregateFunction.js';

// Create a new category
export const createCategory = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    return res.status(201).json(
        new ApiResponse(category, "Category created successfully")
    )
});

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
    const pip_line = await aggregationFunction(Category, req.query, {
        searchFild: ["name", "description"],
        sortFild: "name",
        sortType: req.query.sortType || "desc",
    })

    return res.status(200).json(
        new ApiResponse(pip_line, "Categories fetched successfully")
    )
});

export const getCategoryById = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json(
        new ApiResponse(category, "Category fetched successfully")
    )
});

// Update a category
export const updateCategory = asyncHandler(async (req, res) => {

    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true }
    );
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json(
        new ApiResponse(category, "Category updated successfully")
    )

});

// Delete a category
export const deleteCategory = asyncHandler(async (req, res) => {

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
        return res.status(404).json({ message: 'Category not found' });
    }
    return res.status(200).json(
        new ApiResponse(category, "Category deleted successfully")
    )

});
