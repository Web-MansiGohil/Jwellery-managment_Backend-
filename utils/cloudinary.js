import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// Upload function
export const uploadOnCloudinary = async (file, type = "product") => {
    try {
        if (!file) return null;

        // Check if file exists and has path
        if (!file.path) {
            console.error("Cloudinary Upload Error: File path is missing");
            return null;
        }

        const ext = path.extname(file.originalname);
        const publicId = `${type}_product_${Date.now()}`;

        const result = await cloudinary.uploader.upload(file.path, {
            folder: "products",
            public_id: publicId,
            resource_type: "auto",
        });

        // Delete local file after upload
        fs.unlinkSync(file.path);

        return result;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        if (file?.path) fs.unlinkSync(file.path);
        return null;
    }
};