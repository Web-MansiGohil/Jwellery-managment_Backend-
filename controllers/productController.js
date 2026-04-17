import { Product } from "../Models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { aggregationFunction } from "../utils/aggregateFunction.js";
import { Category } from "../Models/Category.js";
import { Subcategory } from "../Models/Subcategory.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create a new product
export const createProduct = asyncHandler(async (req, res) => {
  const { name, categoryId, subCategoryId, price, description, stock } =
    req.body;

  const images = req.files?.images || [];
  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError("Category is required");
  }

  const subCategory = await Subcategory.findById(subCategoryId);
  if (!subCategory) {
    throw new ApiError("SubCategory is required");
  }

  // Upload images to Cloudinary
  const imageUrls = [];
  for (const file of images) {
    const cloudinaryResult = await uploadOnCloudinary(file, "product");
    if (cloudinaryResult) {
      imageUrls.push(cloudinaryResult.secure_url);
    }
  }

  if (imageUrls.length === 0 && images.length > 0) {
    throw new ApiError("Failed to upload images to Cloudinary");
  }

  // Create product
  const product = await Product.create({
    name,
    categoryId: category._id,
    subCategoryId: subCategory._id,
    price,
    description,
    stock,
    images: imageUrls,
  });

  return res
    .status(201)
    .json(new ApiResponse(product, "Product created successfully"));
});

// Get all products based on query parameters
export const getProducts = async (req, res) => {
  const pip_line = await aggregationFunction(Product, req.query, {
    searchFild: ["name", "description"],

    sortFild: req.query.sortFild || "name",
    sortType: req.query.sortType || "dec",
  });

  return res
    .status(200)
    .json(new ApiResponse(pip_line, "Product fetched successfully"));
};

// Get product details (including images)
export const getProductById = async (req, res) => {
  try {
    console.log(req.params.id);

    const product = await Product.findById(req.params.id)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name");
    // console.log("product", product);

    if (!product) {
      throw new ApiError("Product not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(product, "Product fetched successfully"));
  } catch (err) {
    console.log("err=>", err);

    throw new ApiError("Server error", err.message);
  }
};

// Update a product
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const images = req.files?.images || [];

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError("Product not found");
  }

  if (product.stock <= 0 && req.body.stock <= 0) {
    product.is_deactive = true;
    throw new ApiError("Product is out of stock");
  }

  let updateData = { ...req.body };
  if (images.length > 0) {
    const imageUrls = [];
    for (const file of images) {
      const cloudinaryResult = await uploadOnCloudinary(file, "product");
      if (cloudinaryResult) {
        imageUrls.push(cloudinaryResult.secure_url);
      }
    }
    if (imageUrls.length > 0) {
      updateData.images = imageUrls;
    }
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        { product: updatedProduct },
        "Product updated successfully",
      ),
    );
});

//stock update
export const handleStockStatus = async (product) => {
  // ✅ Product activation/deactivation
  if (product.stock <= 0) {
    product.is_deactive = true;
    product.is_active = false;
  } else {
    product.is_deactive = false;
    product.is_active = true;
  }

  await product.save();

  // ✅ Subcategory logic
  const activeProducts = await Product.find({
    subCategoryId: product.subCategoryId,
    stock: { $gt: 0 },
  });

  if (activeProducts.length === 0) {
    await Subcategory.findByIdAndUpdate(product.subCategoryId, {
      is_deactive: true,
    });
  } else {
    await Subcategory.findByIdAndUpdate(product.subCategoryId, {
      is_deactive: false,
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const result = await aggregationFunction(Product, req.query, {
      searchFild: ["name", "description"],

      lookup: [
        {
          from: "categories", // collection name in MongoDB
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      ],

      unwind: ["category"],

      filter: {}, // you can add dynamic filters later

      sortFild: req.query.sortFild || "createdAt",
      sortType: req.query.sortType || "desc",

      project: {
        name: 1,
        price: 1,
        description: 1,
        "category._id": 1,
        "category.name": 1,
        images: 1,
        stock: 1,
        createdAt: 1,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(result, "Products fetched successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(error.message));
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    console.log(product);
    if (!product) {
      return res.status(404).json(new ApiError("Product not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(product, "Product deleted successfully"));
  } catch (err) {
    return res.status(500).json(new ApiError("Server error", err.message));
  }
};
