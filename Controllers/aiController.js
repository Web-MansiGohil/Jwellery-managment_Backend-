import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// System prompt for jewelry expert chatbot
const JEWELRY_SYSTEM_PROMPT = `You are a luxury jewelry specialist and personal stylist for a premium jewellery brand. 
You help customers with:
- Jewelry recommendations based on occasion, budget, and personal style
- Information about gemstones, metals, and jewelry care
- Styling tips and how to wear jewelry
- Product queries about necklaces, rings, earrings, bracelets, bangles, and anklets
- Answering questions about gold purity (18K, 22K, 24K), diamond clarity, and certifications
Always be warm, knowledgeable, and professional. Keep responses concise (2-3 sentences max unless detail is needed).`;

// Helper: poll Replicate prediction until done
const pollPrediction = async (predictionId, maxWait = 120000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
        const res = await axios.get(
            `https://api.replicate.com/v1/predictions/${predictionId}`,
            { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` } }
        );
        const { status, output, error } = res.data;
        if (status === "succeeded") return output;
        if (status === "failed" || status === "canceled") throw new Error(error || "Prediction failed");
        await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Prediction timed out");
};

// Helper: fetch image URL and convert to base64 data URI
const urlToBase64 = async (url) => {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const base64 = Buffer.from(res.data).toString("base64");
    const mimeType = res.headers["content-type"] || "image/png";
    return `data:${mimeType};base64,${base64}`;
};

// ─── 1. Remove Background (Optimized for Jewelry & Stands) ────────────────
export const removeBackground = async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ success: false, message: "Image is required" });

        console.log("Starting Advanced Jewelry Isolation (Removing background and stands)...");

        // We use Grounded-SAM to specifically isolate the jewelry items from anything else (like stands/mannequins)
        const prediction = await axios.post(
            "https://api.replicate.com/v1/predictions",
            {
                version: "f2c68e378c3b16955bc3dd42b8e3e40fc6c79a295c37e6f6a117d91ec1b7e651",
                input: {
                    image,
                    mask_limit: 1,
                    text_prompt: "jewelry, necklace, ring, earring, gold, diamond, gemstone",
                    box_threshold: 0.25,
                    text_threshold: 0.25,
                },
            },
            {
                headers: {
                    Authorization: `Token ${REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const output = await pollPrediction(prediction.data.id, 130000);
        
        // Grounded-SAM returns an object with 'mask' and 'separated_images'
        // We want the isolated object directly
        let imageUrl = "";
        if (output && output.separated_images && output.separated_images.length > 0) {
            imageUrl = output.separated_images[0];
        } else if (Array.isArray(output)) {
            imageUrl = output[0];
        } else {
            imageUrl = output;
        }

        if (!imageUrl) throw new Error("Could not isolate jewelry from image");

        const processedImage = await urlToBase64(imageUrl);
        console.log("Jewelry isolated successfully.");

        return res.json({ success: true, processedImage });
    } catch (error) {
        console.error("Remove BG Error:", error.message);
        
        // Fallback to standard remove-bg if advanced fails
        try {
            console.log("Advanced isolation failed, falling back to standard BG removal...");
            const fallbackPrediction = await axios.post(
                "https://api.replicate.com/v1/predictions",
                {
                    version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
                    input: { image },
                },
                {
                    headers: {
                        Authorization: `Token ${REPLICATE_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            const output = await pollPrediction(fallbackPrediction.data.id);
            const imageUrl = Array.isArray(output) ? output[0] : output;
            const processedImage = await urlToBase64(imageUrl);
            return res.json({ success: true, processedImage, note: "Used standard fallback" });
        } catch (fallbackError) {
             const status = error.response?.status || 500;
             return res.status(status).json({ success: false, message: "AI Isolation failed: " + error.message });
        }
    }
};

// ─── 2. Detect Jewelry Details (type + suggested position) ────────────────
export const detectJewelryDetails = async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ success: false, message: "Image is required" });

        // Use OpenAI-compatible vision via Replicate (llava)
        const prediction = await axios.post(
            "https://api.replicate.com/v1/predictions",
            {
                version: "6bc1c7bb0d2a34e413301fee8f7cc728d2d4e75b2c9b09ffa01d6bbae9045c5f",
                input: {
                    image,
                    prompt:
                        "Analyze this jewelry image. Identify the type (necklace, ring, earring, bracelet, bangle, anklet). Reply ONLY with JSON: {\"type\":\"necklace\",\"suggestedX\":50,\"suggestedY\":35,\"suggestedScale\":1.2}. suggestedX/Y are percentage positions (0-100). For necklace: Y=35, for ring: Y=60, for earrings: Y=25, for bracelet: Y=70.",
                    max_tokens: 200,
                },
            },
            {
                headers: {
                    Authorization: `Token ${REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const output = await pollPrediction(prediction.data.id);
        const rawText = Array.isArray(output) ? output.join("") : String(output);

        // Extract JSON from response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.json({
                success: true,
                type: parsed.type || "jewelry",
                suggestedX: parsed.suggestedX ?? 50,
                suggestedY: parsed.suggestedY ?? 35,
                suggestedScale: parsed.suggestedScale ?? 1.2,
            });
        }

        // Fallback defaults
        return res.json({ success: true, type: "jewelry", suggestedX: 50, suggestedY: 35, suggestedScale: 1.2 });
    } catch (error) {
        console.error("Detect Jewelry Error:", error.message);
        // Don't block – return safe defaults
        return res.json({ success: true, type: "jewelry", suggestedX: 50, suggestedY: 35, suggestedScale: 1.2 });
    }
};

// ─── 3. Virtual Try-On (AI Merge) ─────────────────────────────────────────
export const virtualTryOn = async (req, res) => {
    try {
        const { userImage, jewelryImage } = req.body;
        if (!userImage || !jewelryImage) {
            return res.status(400).json({ success: false, message: "Both userImage and jewelryImage are required" });
        }

        // Use Stable Diffusion img2img inpainting / blending via Replicate
        const prediction = await axios.post(
            "https://api.replicate.com/v1/predictions",
            {
                version: "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfbe27c0be3e",
                input: {
                    image: userImage,
                    mask: jewelryImage,
                    prompt: "A person wearing beautiful jewelry, photorealistic, high quality, professional photography",
                    negative_prompt: "ugly, blurry, low quality, deformed",
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    strength: 0.7,
                },
            },
            {
                headers: {
                    Authorization: `Token ${REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const output = await pollPrediction(prediction.data.id, 180000);
        const imageUrl = Array.isArray(output) ? output[0] : output;
        const resultImage = await urlToBase64(imageUrl);

        return res.json({ success: true, resultImage });
    } catch (error) {
        console.error("Virtual Try-On Error:", error.message);
        const status = error.response?.status || 500;
        if (status === 402 || status === 429) {
            return res.json({ success: false, errorType: 'quota', message: "Magic AI server is currently at capacity. Activating local Smart Merge." });
        }
        return res.status(status).json({ success: false, message: error.message });
    }
};

// ─── 4. Chat with Jewelry Expert AI ───────────────────────────────────────
export const chatWithJewelryExpert = async (req, res) => {
    try {
        const { message, history = [], image } = req.body;
        if (!message && !image) {
            return res.status(400).json({ success: false, message: "Message or image is required" });
        }

        // Build prompt with history context
        let prompt = JEWELRY_SYSTEM_PROMPT + "\n\nConversation history:\n";
        const recentHistory = history.slice(-6);
        recentHistory.forEach(msg => {
            const role = msg.role === 'model' ? 'Assistant' : 'Customer';
            prompt += `${role}: ${msg.parts?.[0]?.text || msg.text || ''}\n`;
        });
        prompt += `\nCustomer: ${message || 'Please analyze this jewelry image'}\nAssistant:`;

        let modelVersion, inputPayload;
        if (image) {
            // LLaVA vision model
            modelVersion = "6bc1c7bb0d2a34e413301fee8f7cc728d2d4e75b2c9b09ffa01d6bbae9045c5f";
            inputPayload = { image, prompt, max_tokens: 300, temperature: 0.7 };
        } else {
            // Llama 3 text model
            modelVersion = "meta/meta-llama-3-8b-instruct";
            inputPayload = { prompt, max_new_tokens: 300, temperature: 0.7, system_prompt: JEWELRY_SYSTEM_PROMPT };
        }

        const prediction = await axios.post(
            "https://api.replicate.com/v1/predictions",
            { version: modelVersion, input: inputPayload },
            { headers: { Authorization: `Token ${REPLICATE_API_TOKEN}`, "Content-Type": "application/json" } }
        );

        const output = await pollPrediction(prediction.data.id, 60000);
        const responseText = Array.isArray(output) ? output.join("") : String(output || "");

        return res.json({ success: true, response: responseText.trim() });
    } catch (error) {
        console.error("Chat Error:", error.message);
        // Always return a friendly fallback - don't crash the chat
        return res.json({
            success: true,
            response: "I'm your jewelry specialist! I can help you find the perfect piece for any occasion. What are you looking for today?",
        });
    }
};
