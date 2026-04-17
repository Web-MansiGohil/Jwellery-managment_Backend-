import mongoose from "mongoose";
import { Subcategory } from "./Models/Subcategory.js";
import dotenv from "dotenv";

dotenv.config();

const restoreData = [
  { id: "69cfc0406827fc966508fb35", name: "Earrings", categoryId: "69c8e3bc65780239404ce47e" },
  { id: "69cfc7b4edc2d05a5ebd5e15", name: "Neckless", categoryId: "69c8e3bc65780239404ce47f" },
  { id: "69c8e85a6c6c89133e7a4f42", name: "Platinum Neckless", categoryId: "69c8e3bc65780239404ce480" },
  { id: "69ca687d32c7ce0106d77593", name: "Platinum Bangles", categoryId: "69c8e3bc65780239404ce480" },
  { id: "69c9f26f85c01b535304abc5", name: "Gold Bridal Set", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69cfc652edc2d05a5ebd5e03", name: "Pendant", categoryId: "69c8e3bc65780239404ce47e" },
  { id: "69ce58dd2589e888be744d58", name: "Platinum Ring", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69cfc80fedc2d05a5ebd5e28", name: "Platinum Chains", categoryId: "69c8e3bc65780239404ce480" },
  { id: "69ce6598848f68a8dd56ab9c", name: "Bangles", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69cfc0006827fc966508fb30", name: "Diamond Necklace", categoryId: "69c8e3bc65780239404ce47e" },
  { id: "69c8e85b6c6c89133e7a4f62", name: "Bangles", categoryId: "69c8e3bc65780239404ce481" },
  { id: "69cfc632edc2d05a5ebd5dfe", name: "Bracelets", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69cfc798edc2d05a5ebd5e10", name: "Bracelets", categoryId: "69c8e3bc65780239404ce481" },
  { id: "69d73ace0fb486d41e7bec8e", name: "Rubic Ring", categoryId: "69c8e3bc65780239404ce47f" },
  { id: "69d73c0d0fb486d41e7bec93", name: "Diamond Bracelet", categoryId: "69c8e3bc65780239404ce47e" },
  { id: "69d73d2a0fb486d41e7bec97", name: "Gold Set", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69d73e0b0fb486d41e7bec9b", name: "Gold Ring", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69d73f310fb486d41e7bec9f", name: "Fancy Bracelet", categoryId: "69c8e3bc65780239404ce481" },
  { id: "69d7400a0fb486d41e7beca2", name: "Silver Ring", categoryId: "69c8e3bc65780239404ce481" },
  { id: "69c8f202ebb3a6fdc23df9c7", name: "Platinum Ring", categoryId: "69c8e3bc65780239404ce480" },
  { id: "69ca689032c7ce0106d77598", name: "Gold Wedding Earring", categoryId: "69c8f201ebb3a6fdc23df9c2" },
  { id: "69d745b60fb486d41e7becab", name: "Rubic Necklace", categoryId: "69c8e3bc65780239404ce47f" },
  { id: "69d7476e0fb486d41e7becb0", name: "Silver Earring", categoryId: "69c8e3bc65780239404ce481" }
];

async function restore() {
  try {
    console.log("Connecting to MongoDB for internal restore...");
    await mongoose.connect(process.env.MONGO_URI);
    
    for (const item of restoreData) {
      await Subcategory.findOneAndUpdate(
        { _id: item.id },
        { _id: item.id, name: item.name, category_id: item.categoryId },
        { upsert: true }
      );
    }
    
    console.log("Restore successful!");
    process.exit(0);
  } catch (err) {
    console.error("Restore failed:", err);
    process.exit(1);
  }
}

restore();
