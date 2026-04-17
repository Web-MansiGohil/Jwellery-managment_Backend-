// Test Cloudinary Configuration
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

console.log("Testing Cloudinary configuration...");

cloudinary.api.ping()
    .then((result) => {
        console.log("✅ Cloudinary connection successful!");
        console.log("Cloud Name:", process.env.CLOUD_NAME);
        console.log("API Key:", process.env.API_KEY ? "Set" : "Not set");
        console.log("API Secret:", process.env.API_SECRET ? "Set" : "Not set");
    })
    .catch((error) => {
        console.error("❌ Cloudinary connection failed:");
        console.error("Error:", error.message);
        console.log("Please check your environment variables:");
        console.log("CLOUD_NAME:", process.env.CLOUD_NAME);
        console.log("API_KEY:", process.env.API_KEY);
        console.log("API_SECRET:", process.env.API_SECRET);
    });