
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function testAnalyze() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("No API KEY found");
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Use a tiny dummy base64 image (1x1 white pixel)
    const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

    try {
        console.log("Testing image analysis...");
        const result = await model.generateContent([
            "What is in this image?",
            {
                inlineData: {
                    data: dummyImage,
                    mimeType: "image/png",
                },
            },
        ]);
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Error:", error);
    }
}

testAnalyze();
