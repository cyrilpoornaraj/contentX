import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from 'rss-parser';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
const parser = new Parser();

async function generateSinglePost() {
    console.log("📡 Fetching latest tech stories from TechCrunch...");
    const feed = await parser.parseURL('https://techcrunch.com/feed/');
    
    const dir = path.join(process.cwd(), 'services', 'render-engine');
    const historyPath = path.join(dir, 'posted_history.json');
    const jsonPath = path.join(dir, 'daily_news.json');

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Load history of already posted article links to avoid duplicates
    let postedLinks = [];
    if (fs.existsSync(historyPath)) {
        postedLinks = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    // Find the first story that hasn't been posted yet
    const freshStory = feed.items.find(item => !postedLinks.includes(item.link));

    if (!freshStory) {
        console.log("⚠️ No new unposted stories found right now.");
        return;
    }

    // Randomly choose post type (carousel or single)
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
        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        const postData = JSON.parse(responseText);
        postData.source_link = freshStory.link;
        
        // Overwrite or append to daily_news.json for the rendering engine to pick up
        fs.writeFileSync(jsonPath, JSON.stringify([postData], null, 2));
        
        // Save to history so it never posts twice
        postedLinks.push(freshStory.link);
        fs.writeFileSync(historyPath, JSON.stringify(postedLinks, null, 2));

        console.log(`✅ Success! Post generated and saved for rendering.`);

    } catch (error) {
        console.error(`❌ Generation failed: ${error.message}`);
        process.exit(1);
    }
}

generateSinglePost();