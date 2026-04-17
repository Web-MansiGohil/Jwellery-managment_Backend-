import mongoose from "mongoose";
import { Subcategory } from "./Models/Subcategory.js";
import dotenv from "dotenv";

dotenv.config();

async function cleanup() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const prefixes = ["Gold", "Silver", "Platinum", "Diamond", "Rubic"];
    const regex = new RegExp(`^(${prefixes.join('|')})\\s+`, 'i');
    
    console.log("Cleaning up old subcategories with prefixes...");
    const result = await Subcategory.deleteMany({ name: { $regex: regex } });
    
    console.log(`Deleted ${result.deletedCount} old subcategories.`);
    console.log("Cleanup completed!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
