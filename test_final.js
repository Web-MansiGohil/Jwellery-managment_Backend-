
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function testFetchFinal() {
    const key = process.env.GEMINI_API_KEY.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    
    try {
        console.log("Testing with gemini-2.0-flash...");
        const response = await axios.post(url, {
            contents: [{ role: "user", parts: [{ text: "Hi, are you working now?" }] }]
        });
        console.log("Success! Response:", response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.log("Failed with status:", error.response?.status);
        console.log("Error data:", JSON.stringify(error.response?.data, null, 2));
    }
}

testFetchFinal();
