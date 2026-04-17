import mongoose from "mongoose";
import { Product } from "./Models/Product.js";
import { Subcategory } from "./Models/Subcategory.js";
import dotenv from "dotenv";

dotenv.config();

async function migrateAndDelete() {
  try {
    console.log("Connecting to MongoDB for Migration...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const subcategories = await Subcategory.find();
    
    // Mapping of new standard subcategories
    const standardNames = [
      "Rings", "Earrings", "Necklaces", "Pendants", "Bangles", 
      "Bracelets", "Nose Pins", "Sets", "Anklets", "Chokers"
    ];

    console.log("Migrating products to new subcategories...");
    const products = await Product.find();
    
    for (const prod of products) {
      if (!prod.subCategoryId) continue;
      
      const oldSub = subcategories.find(s => s._id.toString() === prod.subCategoryId.toString());
      if (!oldSub) continue;
      
      const oldName = oldSub.name.toLowerCase();
      let newName = "";
      
      // Determine new generic name from old material-prefixed name
      if (oldName.includes("ring")) newName = "Rings";
      else if (oldName.includes("earring")) newName = "Earrings";
      else if (oldName.includes("neckl") || oldName.includes("set")) newName = "Necklaces";
      else if (oldName.includes("pendant")) newName = "Pendants";
      else if (oldName.includes("bangle")) newName = "Bangles";
      else if (oldName.includes("bracelet") || oldName.includes("braslate")) newName = "Bracelets";
      else if (oldName.includes("nose")) newName = "Nose Pins";
      else if (oldName.includes("anklet")) newName = "Anklets";
      else if (oldName.includes("choker")) newName = "Chokers";
      
      if (newName) {
        // Find the new standard subcategory ID for the same category
        const targetSub = subcategories.find(s => s.name === newName && s.category_id.toString() === prod.categoryId.toString());
        if (targetSub) {
          prod.subCategoryId = targetSub._id;
          await prod.save();
        }
      }
    }
    
    console.log("Migration done. Deleting old material-prefixed subcategories...");
    const prefixes = ["Gold", "Silver", "Platinum", "Diamond", "Rubic"];
    const regex = new RegExp(`^(${prefixes.join('|')})\\s+`, 'i');
    
    await Subcategory.deleteMany({ name: { $regex: regex } });
    
    // Also delete some misspelled ones or odd ones
    await Subcategory.deleteMany({ name: { $in: ["Neckless", "Platinum neckless", "Braslate"] } });

    console.log("Success! Everything is clean now.");
    process.exit(0);
  } catch (err) {
    console.error("Migration/Cleanup failed:", err);
    process.exit(1);
  }
}

migrateAndDelete();
