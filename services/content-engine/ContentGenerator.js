class ContentGenerator {
    constructor(aiService) {
        this.aiService = aiService;
    }

    async createDailyPost(topic) {
        console.log(`[ContentGenerator] Starting dynamic research for: ${topic}...`);

        const prompt = `
            You are a senior software engineer and system design expert. 
            Create an educational Instagram carousel about: ${topic}.
            
            RULES:
            1. The post_title must be catchy.
            2. Generate 4 to 7 educational slides.
            3. Each educational slide must have a 'slide_title' (e.g., "What is a Monolith?") and an array of 2 to 3 'bullet_points'.
            4. Keep bullet points concise, technical, but easy to read.
            5. DO NOT generate a Call-to-Action or summary slide at the end. We handle that separately.
            6. Generate a short, context-specific 'theme_tag' (1-2 words max, e.g., "SYSTEM DESIGN", "DEVOPS", "DATABASES").
        `;

        const schema = {
            type: "OBJECT",
            properties: {
                post_title: { type: "STRING" },
                trigger_word: { type: "STRING" },
                theme_tag: { type: "STRING" },
                slides: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            slide_title: { type: "STRING" },
                            bullet_points: {
                                type: "ARRAY",
                                items: { type: "STRING" }
                            }
                        },
                        required: ["slide_title", "bullet_points"]
                    }
                }
            },
            required: ["post_title", "trigger_word", "theme_tag", "slides"]
        };

        const result = await this.aiService.generateStructuredData(prompt, schema);
        console.log(`[ContentGenerator] Content generated with trigger word: '${result.trigger_word}' and tag: '${result.theme_tag}'`);

        return result;
    }
}

export default ContentGenerator;