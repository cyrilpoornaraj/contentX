import GeminiService from './GeminiService.js';
import ContentGenerator from './ContentGenerator.js';

async function main() {
    const aiService = new GeminiService();
    const generator = new ContentGenerator(aiService);

    // Changed to a topic that might trigger a single image or animation
    const topic = "Visualizing the Event Loop in Node.js";

    try {
        const finalOutput = await generator.createDailyPost(topic);
        console.log(JSON.stringify(finalOutput, null, 2));
    } catch (error) {
        console.error("Application Failed:", error.message);
    }
}

main();