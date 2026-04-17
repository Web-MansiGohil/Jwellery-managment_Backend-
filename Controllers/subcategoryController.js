import { asyncHandler } from "../utils/asyncHandler.js";
import { Subcategory } from "../Models/Subcategory.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../Models/Category.js";
import { aggregationFunction } from "../utils/aggregateFunction.js";


const createSubcategory = asyncHandler(async (req, res) => {
    const { name, category_id, description } = req.body;

    if (!name) {
        throw new Error("Please provide name");
    }

    const category = await Category.findById(category_id);
    if (!category) {
        throw new Error("Category not found");
    }

    const subcategory = await Subcategory.create({ name, category_id: category, description });

    return res.status(201).json(
        new ApiResponse(subcategory, "Subcategory created successfully")
    )
});

const getAllSubcategories = asyncHandler(async (req, res) => {

    const pip_line = await aggregationFunction(Subcategory, req.query, {
        searchFild: ["name", "description"],
        sortFild: "name",
        sortType: req.query.sortType || "desc",
        lookup: [
            {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category_id"
            }
        ],
        unwind: ["category_id"]
    })

    return res.status(200).json(
        new ApiResponse(pip_line, "Subcategory fetched successfully")
    )
});

const getSubcategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subcategory = await Subcategory.findById(id);
    return res.status(200).json(
        new ApiResponse(subcategory, "Subcategory fetched successfully")
    )
});

const updateSubcategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subcategory = await Subcategory.findByIdAndUpdate(id, req.body, { new: true }).populate('category_id');;
    return res.status(200).json(
        new ApiResponse(subcategory, "Subcategory updated successfully")
    )
});

const deleteSubcategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const subcategory = await Subcategory.findByIdAndDelete(id);
    return res.status(200).json(
        new ApiResponse(subcategory, "Subcategory deleted successfully")
    )
});

export {
    createSubcategory,
    getAllSubcategories,
    getSubcategoryById,
    updateSubcategory,
    deleteSubcategory
}
