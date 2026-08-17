import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    async generateStructuredData(prompt, schema) {
        try {
            const response = await this.ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: prompt,
                config: {
                    // CORRECTED SDK SYNTAX: This forces the API to ONLY return valid JSON matching your schema
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });

            const rawText = response.text;

            // We keep the sanitization just in case the model adds weird whitespace
            const firstBrace = rawText.indexOf('{');
            const lastBrace = rawText.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No valid JSON object found in the AI response.");
            }

            const cleanJsonString = rawText.substring(firstBrace, lastBrace + 1);

            // DEBUGGING BLOCK: Try to parse, but if it fails, print the exact broken string
            try {
                return JSON.parse(cleanJsonString);
            } catch (parseError) {
                console.error("❌ THE MODEL GENERATED INVALID JSON. RAW OUTPUT WAS:\n", cleanJsonString);
                throw parseError; // Throw the error so the app knows it failed
            }

        } catch (error) {
            console.error("Gemini API Error:", error.message);
            throw new Error("Failed to communicate with AI model or parse the response.");
        }
    }
}

export default GeminiService;