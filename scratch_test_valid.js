
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function testChat() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("No API KEY found");
        return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Valid history starts with user or is empty
    const history = [
        {
            role: "user",
            parts: [{ text: "Hi" }]
        },
        {
            role: "model",
            parts: [{ text: "Hello! I am your personal jewelry specialist. How can I help you today?" }]
        }
    ];

    try {
        console.log("Starting chat with valid history...");
        const chat = model.startChat({ history });
        const result = await chat.sendMessage("Tell me about gold jewelry.");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Error details:", error);
    }
}

testChat();
