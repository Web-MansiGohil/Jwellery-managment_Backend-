
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function findWorkingModel() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("No API KEY found");
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
    
    for (const modelName of models) {
        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            console.log(`Success with ${modelName}:`, result.response.text());
            return modelName;
        } catch (error) {
            console.log(`Failed with ${modelName}: ${error.message}`);
        }
    }
}

findWorkingModel();
