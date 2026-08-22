class ContentGenerator {
    constructor(aiService) {
        this.aiService = aiService;
    }

    async createDailyPost(topic) {
        console.log(`[ContentGenerator] Starting DSA content generation for: ${topic}...`);

        const prompt = `
            You are a brilliant software engineer who teaches complex Data Structures and Algorithms (DSA) to absolute beginners as if they were kindergarteners.
            Use funny, playful metaphors (Legos, toys, games, magic) to explain the algorithm for: ${topic}.
            
            RULES (MANDATORY STRICT CONSTRAINTS):
            1. Generate TWO distinct pieces of content: a Carousel and a Reel script.
            2. CAROUSEL RULES (CRITICAL FIX):
               - MUST contain between 4 and 7 slides total.
               - The FINAL slide in the 'slides' array MUST be a dedicated Call to Action slide. 
               - The final slide's 'slide_title' should be strong (e.g., "Want the full guide?").
               - The final slide's 'bullet_points' array MUST contain exactly ONE string: "Follow us & Comment 'DSA' for the magical toy guide!".
               - DO NOT put the CTA as a bullet point on a normal educational slide. It must have its own dedicated slide.
            3. The Reel MUST contain EXACTLY 6 scenes. The video engine will crash if you provide fewer than 6 scenes.
            4. DSA REEL STORYBOARD (FOLLOW THIS EXACTLY):
               - Scene 1 (The Hook): "UNIVERSAL_GRAPH" showing the data structure visually.
               - Scene 2 (The Brute Force): "CODE_WALKTHROUGH" showing the naive code.
               - Scene 3 (The Optimal): "CODE_WALKTHROUGH" showing the optimal code.
               - Scene 4 (Visual Execution): "UNIVERSAL_GRAPH" showing the algorithm moving.
               - Scene 5 (Big O): "TEXT_REVEAL" format strictly as "Brute Force: O(...) Time" and "Optimal: O(...) Time".
               - Scene 6 (The CTA): "TEXT_REVEAL" strictly output: "Follow us & Comment 'DSA' for the full guide!"
            5. GRAPH RULES: 
               - X and Y coordinates MUST ONLY be between 20 and 80.
               - You MUST provide the 'edges' array to draw connecting lines.
            6. WALKTHROUGH RULES (CRITICAL FIX): 
               - YOU MUST PROVIDE AT LEAST ONE ANNOTATION for every CODE_WALKTHROUGH. Do not leave it empty.
               - THE ARRAYS ARE 0-INDEXED. If you write 3 lines of code, the 'line_index' MUST BE 0, 1, or 2. If you use 1-based indexing, the video engine will crash and annotations will not appear.
               - Keep annotation labels UNDER 6 WORDS (e.g., "O(N) Time", "Moves to next block").
            7. TONE: Lighthearted, funny, and simple toy metaphors.
        `;

        const schema = {
            type: "OBJECT",
            properties: {
                trigger_word: { type: "STRING" },
                theme_tag: { type: "STRING" },
                carousel_data: {
                    type: "OBJECT",
                    properties: {
                        post_title: { type: "STRING" },
                        slides: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    slide_title: { type: "STRING" },
                                    bullet_points: { type: "ARRAY", items: { type: "STRING" } }
                                },
                                required: ["slide_title", "bullet_points"]
                            }
                        }
                    },
                    required: ["post_title", "slides"]
                },
                reel_script: {
                    type: "OBJECT",
                    properties: {
                        reel_title: { type: "STRING" },
                        scenes: {
                            type: "ARRAY",
                            description: "You MUST provide exactly 6 items.",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    visual_type: { type: "STRING" },
                                    spoken_script: { type: "STRING" },
                                    visual_data: {
                                        type: "OBJECT",
                                        properties: {
                                            text_lines: { type: "ARRAY", items: { type: "STRING" } },
                                            annotations: {
                                                type: "ARRAY",
                                                description: "CRITICAL: You MUST include at least one annotation here. line_index MUST start at 0.",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        line_index: { type: "INTEGER" },
                                                        label: { type: "STRING" }
                                                    },
                                                    required: ["line_index", "label"]
                                                }
                                            },
                                            nodes: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        id: { type: "STRING" },
                                                        label: { type: "STRING" },
                                                        x: { type: "INTEGER" },
                                                        y: { type: "INTEGER" },
                                                        shape: { type: "STRING" },
                                                        color: { type: "STRING" }
                                                    },
                                                    required: ["id", "label", "x", "y", "shape", "color"]
                                                }
                                            },
                                            edges: {
                                                type: "ARRAY",
                                                items: {
                                                    type: "OBJECT",
                                                    properties: {
                                                        from: { type: "STRING" },
                                                        to: { type: "STRING" }
                                                    },
                                                    required: ["from", "to"]
                                                }
                                            }
                                        }
                                    }
                                },
                                required: ["visual_type", "spoken_script", "visual_data"]
                            }
                        }
                    },
                    required: ["reel_title", "scenes"]
                }
            },
            required: ["trigger_word", "theme_tag", "carousel_data", "reel_script"]
        };

        const result = await this.aiService.generateStructuredData(prompt, schema);
        console.log(`[ContentGenerator] Generated DSA scripts.`);

        return result;
    }
}

export default ContentGenerator;