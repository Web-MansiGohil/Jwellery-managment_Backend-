
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function testFetch() {
    const key = process.env.GEMINI_API_KEY.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    try {
        console.log("Testing with manual axios fetch...");
        const response = await axios.post(url, {
            contents: [{ role: "user", parts: [{ text: "Hi" }] }]
        });
        console.log("Success! Response:", response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.log("Failed with status:", error.response?.status);
        console.log("Error data:", JSON.stringify(error.response?.data, null, 2));
    }
}

testFetch();
