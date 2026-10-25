import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
const parser = new Parser();

async function generateWithRetry(prompt, retries = 3, delayMs = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.log(`⚠️ Attempt ${i + 1} failed: ${error.message}. Retrying in ${delayMs/1000}s...`);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

async function generateSinglePost() {
    console.log("📡 Fetching latest tech stories from TechCrunch...");
    const feed = await parser.parseURL('https://techcrunch.com/feed/');
    
    const dir = path.join(process.cwd(), 'services', 'render-engine');
    const historyPath = path.join(dir, 'posted_history.json');
    const jsonPath = path.join(dir, 'daily_news.json');

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let postedLinks = [];
    if (fs.existsSync(historyPath)) {
        postedLinks = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    const freshStory = feed.items.find(item => !postedLinks.includes(item.link));

    if (!freshStory) {
        console.log("⚠️ No new unposted stories found right now.");
        return;
    }

    const postType = Math.random() < 0.6 ? 'carousel' : 'single';
    console.log(`🧠 Generating ${postType} content for: ${freshStory.title}...`);

    const prompt = `
    You are a top-tier tech news copywriter creating an Instagram ${postType}.
    Story Title: ${freshStory.title}
    Story Summary: ${freshStory.contentSnippet || freshStory.content}
    
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

    try {
        const responseText = await generateWithRetry(prompt);
        const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const postData = JSON.parse(cleanText);
        postData.source_link = freshStory.link;
        
        fs.writeFileSync(jsonPath, JSON.stringify([postData], null, 2));
        
        postedLinks.push(freshStory.link);
        fs.writeFileSync(historyPath, JSON.stringify(postedLinks, null, 2));

        console.log(`✅ Success! Post generated and saved for rendering.`);

    } catch (error) {
        console.error(`❌ Generation permanently failed: ${error.message}`);
        process.exit(1);
    }
}

generateSinglePost();