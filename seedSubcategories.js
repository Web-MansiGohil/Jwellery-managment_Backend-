import mongoose from "mongoose";
import { Category } from "./Models/Category.js";
import { Subcategory } from "./Models/Subcategory.js";
import dotenv from "dotenv";

dotenv.config();

const subCats = [
  "Rings", "Earrings", "Necklaces", "Pendants", "Bangles", 
  "Bracelets", "Nose Pins", "Sets", "Anklets", "Chokers"
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected. Fetching categories...");
    
    const categories = await Category.find();
    console.log(`Found ${categories.length} categories.`);
    
    for (const cat of categories) {
      console.log(`Seeding subcategories for category: ${cat.name}`);
      for (const name of subCats) {
        await Subcategory.findOneAndUpdate(
          { name, category_id: cat._id },
          { name, category_id: cat._id },
          { upsert: true }
        );
      }
    }
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
