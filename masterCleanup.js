import mongoose from "mongoose";
import { Product } from "./Models/Product.js";
import { Subcategory } from "./Models/Subcategory.js";
import dotenv from "dotenv";

dotenv.config();

const STANDARD_NAMES = [
  "Rings", "Earrings", "Necklaces", "Pendants", "Bangles",
  "Bracelets", "Nose Pins", "Sets", "Anklets", "Chokers"
];

async function finalMasterCleanup() {
  try {
    console.log("Connecting to MongoDB for Master Cleanup...");
    await mongoose.connect(process.env.MONGO_URI);

    const allSubs = await Subcategory.find();

    // 1. DEDUPLICATE STANDARD NAMES per category
    console.log("Deduplicating standard names...");
    const seen = new Set();
    for (const sub of allSubs) {
      const key = `${sub.name}-${sub.category_id}`;
      if (STANDARD_NAMES.includes(sub.name)) {
        if (seen.has(key)) {
          // Duplicate standard name, will delete later
        } else {
          seen.add(key);
        }
      }
    }

    // 2. MIGRATE PRODUCTS to the first occurrence of standard names
    console.log("Migrating all products to standard names...");
    const products = await Product.find();
    for (const prod of products) {
      if (!prod.subCategoryId) continue;
      const currentSub = await Subcategory.findById(prod.subCategoryId);
      if (!currentSub) continue;

      let targetName = "";
      const n = currentSub.name.toLowerCase();
      if (n.includes("ring")) targetName = "Rings";
      else if (n.includes("earring")) targetName = "Earrings";
      else if (n.includes("neckl") || n.includes("set") || n.includes("choker")) {
        if (n.includes("choker")) targetName = "Chokers";
        else if (n.includes("set")) targetName = "Sets";
        else targetName = "Necklaces";
      }
      else if (n.includes("pendant")) targetName = "Pendants";
      else if (n.includes("bangle")) targetName = "Bangles";
      else if (n.includes("bracelet") || n.includes("braslate")) targetName = "Bracelets";
      else if (n.includes("nose")) targetName = "Nose Pins";
      else if (n.includes("anklet")) targetName = "Anklets";

      if (targetName && targetName !== currentSub.name) {
        const targetSub = await Subcategory.findOne({ name: targetName, category_id: prod.categoryId });
        if (targetSub) {
          prod.subCategoryId = targetSub._id;
          await prod.save();
        }
      }
    }

    // 3. DELETE EVERYTHING that is NOT a standard name or is a duplicate
    console.log("Deleting non-standard and duplicate subcategories...");
    const finalSubs = await Subcategory.find();
    const keptIds = new Set();
    const uniqueKeys = new Set();

    for (const sub of finalSubs) {
      const key = `${sub.name}-${sub.category_id}`;
      if (STANDARD_NAMES.includes(sub.name) && !uniqueKeys.has(key)) {
        keptIds.add(sub._id.toString());
        uniqueKeys.add(key);
      }
    }

    const deleteResult = await Subcategory.deleteMany({ _id: { $nin: Array.from(keptIds).map(id => new mongoose.Types.ObjectId(id)) } });
    console.log(`Deleted ${deleteResult.deletedCount} unwanted subcategories.`);

    console.log("MASTER CLEANUP SUCCESSFUL!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

finalMasterCleanup();
