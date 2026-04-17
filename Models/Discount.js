import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({

});

export const Discount = mongoose.model("Discount", discountSchema);