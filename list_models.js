
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        console.log("Listing models...");
        const response = await axios.get(url);
        console.log("Available models:", response.data.models.map(m => m.name));
    } catch (error) {
        console.log("Failed with status:", error.response?.status);
        console.log("Error data:", JSON.stringify(error.response?.data, null, 2));
    }
}

listModels();
