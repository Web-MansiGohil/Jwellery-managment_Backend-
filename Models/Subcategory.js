import mongoose from "mongoose";


const subcategorySchema = new mongoose.Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    }
});

export const Subcategory = mongoose.model("Subcategory", subcategorySchema);