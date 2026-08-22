import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    // We add a maxRetries parameter, defaulting to 3 attempts
    async generateStructuredData(prompt, schema, maxRetries = 3) {
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                const response = await this.ai.models.generateContent({
                    model: "gemini-3.5-flash-lite",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema
                    }
                });

                const rawText = response.text;

                const firstBrace = rawText.indexOf('{');
                const lastBrace = rawText.lastIndexOf('}');

                if (firstBrace === -1 || lastBrace === -1) {
                    throw new Error("No valid JSON object found in the AI response.");
                }

                const cleanJsonString = rawText.substring(firstBrace, lastBrace + 1);

                return JSON.parse(cleanJsonString);

            } catch (error) {
                attempt++;
                console.warn(`[GeminiService] API hiccup on attempt ${attempt}: ${error.message}`);

                if (attempt >= maxRetries) {
                    console.error("❌ FAILED AFTER 3 ATTEMPTS.");
                    throw new Error("Failed to communicate with AI model or parse the response.");
                }

                // Wait 2 seconds, then 4 seconds, etc., before retrying
                const waitTime = attempt * 2000;
                console.log(`⏳ Servers busy. Retrying in ${waitTime / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
}

export default GeminiService;