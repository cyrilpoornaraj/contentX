class ContentGenerator {
    constructor(aiService) {
        this.aiService = aiService;

        // UPDATED SCHEMA: Allowing dynamic formats and trigger words
        this.schema = {
            type: "object",
            properties: {
                post_type: {
                    type: "string",
                    description: "Choose the best format: 'carousel' (2-8 slides), 'single_image', or 'animation_concept'",
                    enum: ["carousel", "single_image", "animation_concept"]
                },
                trigger_word: {
                    type: "string",
                    description: "A single, relevant word the user must comment to get the guide (e.g., 'API', 'REACT', 'GIT')"
                },
                post_title: {
                    type: "string",
                    description: "The main hook or title of the post"
                },
                slides: {
                    type: "array",
                    description: "If post_type is carousel, provide an array of slide text. If single_image, provide an array with exactly ONE item. If animation_concept, describe the scenes.",
                    items: { type: "string" }
                },
                caption: {
                    type: "string",
                    description: "The caption text. MUST include instructions telling the user to comment the trigger_word to receive the guide."
                },
                markdown_guide: {
                    type: "string"
                }
            },
            required: ["post_type", "trigger_word", "post_title", "slides", "caption", "markdown_guide"]
        };
    }

    async createDailyPost(topic) {
        console.log(`[ContentGenerator] Starting dynamic research for: ${topic}...`);

        // UPDATED PROMPT: Giving the AI creative freedom
        const prompt = `You are an expert coding influencer on Instagram. 
        Create an engaging post and a detailed markdown guide about: ${topic}. 
        
        CRITICAL INSTRUCTIONS:
        1. Choose the best format for this topic (carousel, single image, or animation concept). If it's a carousel, use anywhere from 2 to 8 slides depending on what the topic requires.
        2. Create a unique, relevant 'trigger word' related to the topic (e.g., 'NODE', 'CSS', 'DOCKER'). 
        3. Write a caption that tells the user to comment that specific trigger word to receive the full guide. Make it sound natural.`;

        const content = await this.aiService.generateStructuredData(prompt, this.schema);
        console.log(`[ContentGenerator] Dynamic format generated: ${content.post_type} with trigger word '${content.trigger_word}'`);

        return content;
    }
}

export default ContentGenerator;