import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
const parser = new Parser();

// Robust paths constructed using process.cwd()
const RENDER_ENGINE_DIR = path.join(process.cwd(), 'services', 'render-engine');
const JSON_PATH = path.join(RENDER_ENGINE_DIR, 'daily_news.json');

function getRandomMix() {
    const mix = ['carousel', 'carousel', 'carousel', 'single', 'single'];
    return mix.sort(() => Math.random() - 0.5);
}

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateDailyNews() {
    console.log("📡 Fetching top 5 tech stories for automated processing...");
    const feed = await parser.parseURL('https://techcrunch.com/feed/');
    const topStories = feed.items.slice(0, 5);
    const dailyMix = getRandomMix();
    
    const generatedPosts = [];

    if (!fs.existsSync(RENDER_ENGINE_DIR)) {
        fs.mkdirSync(RENDER_ENGINE_DIR, { recursive: true });
    }

    for (let i = 0; i < topStories.length; i++) {
        const story = topStories[i];
        const postType = dailyMix[i]; 

        console.log(`\n[${new Date().toLocaleTimeString()}] 🧠 Generating ${postType} content for: ${story.title}...`);

        const prompt = `
        You are a top-tier tech news copywriter creating an Instagram ${postType}.
        Story Title: ${story.title}
        Story Summary: ${story.contentSnippet || story.content}
        
        Output MUST be valid JSON with this exact structure:
        {
          "type": "${postType}",
          "image_prompt": "A cinematic, hyper-realistic image prompt for an AI image generator representing this story. Dark mode, neon blue and black accents. No text.",
          "slides": [
             // IF type is "single": Generate EXACTLY 1 slide. "headline" must be a short, massive bold hook. "body" must be a punchy 1-2 sentence description expanding on the hook.
             // IF type is "carousel": Generate 3 to 4 slides explaining the story in detail. Each slide needs a "headline" and a "body".
          ],
          "caption": "Engaging Instagram caption summarizing the news with a call to action to follow @techseithigal."
        }
        Return ONLY raw JSON. Do not use markdown code blocks.
        `;

        let success = false;
        let attempts = 0;
        
        while (!success && attempts < 3) {
            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                
                const postData = JSON.parse(responseText);
                postData.source_link = story.link;
                
                // Add to array and save immediately to disk (incremental save)
                generatedPosts.push(postData);
                fs.writeFileSync(JSON_PATH, JSON.stringify(generatedPosts, null, 2));
                
                success = true;
                console.log(`✅ Success! Post saved to daily_news.json.`);
                
                // If it is not the last story, sleep for 1 hour to bypass traffic/rate limits safely
                if (i < topStories.length - 1) {
                    console.log("⏳ Sleeping for 1 hour before the next request...");
                    await delay(60 * 60 * 1000); // 1 hour in milliseconds
                }

            } catch (error) {
                attempts++;
                console.error(`⚠️ Attempt ${attempts} failed: ${error.message}`);
                
                if (attempts >= 3) {
                    console.error(`❌ Skipping story after 3 failed attempts.`);
                } else {
                    console.log("⏳ Waiting 2 minutes before retrying...");
                    await delay(120000);
                }
            }
        }
    }
    
    console.log("\n🚀 Processing complete! All posts generated and saved.");
}

generateDailyNews();