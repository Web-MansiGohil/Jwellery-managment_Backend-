import axios from 'axios';

async function testAI() {
    try {
        console.log("Testing Backend AI Routes...");
        // Test removing background with a dummy input or just check if route exists
        const res = await axios.post('http://localhost:8001/api/ai/remove-background', {
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
        }).catch(err => err.response);
        
        console.log("Status:", res.status);
        console.log("Data:", res.data);
    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

testAI();
