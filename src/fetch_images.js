import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Robust absolute paths constructed using process.cwd()
const RENDER_ENGINE_DIR = path.join(process.cwd(), 'services', 'render-engine');
const ASSETS_DIR = path.join(RENDER_ENGINE_DIR, 'assets');
const JSON_PATH = path.join(RENDER_ENGINE_DIR, 'daily_news.json');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchBackgroundImages() {
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ daily_news.json not found at ${JSON_PATH}! Run the orchestrator first.`);
        return;
    }

    const posts = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const apiKey = process.env.POLLINATIONS_API_KEY;

    if (!apiKey) {
        console.error("❌ POLLINATIONS_API_KEY is missing from your .env file!");
        return;
    }

    console.log("🎨 Starting free AI Image Generation...\n");

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        
        // Enhance the prompt with strict brand colors and Instagram dimensions
        const enhancedPrompt = `${post.image_prompt}, neon blue and deep black color palette, dark mode, cinematic lighting, 8k resolution, no text`;
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        
        // Pass the prompt and the API key to Pollinations
        const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&width=1080&height=1920&nologo=true&key=${apiKey}`;
        
        const fileName = `bg_${i + 1}.jpg`;
        const filePath = path.join(ASSETS_DIR, fileName);
        const postLabel = post.title || (post.slides?.[0]?.headline) || `Post ${i + 1}`;

        console.log(`🖼️ Generating image for Post ${i + 1}: ${postLabel}...`);

        try {
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(filePath, buffer);
            
            post.local_image_path = `./assets/${fileName}`;
            
            console.log(`✅ Saved ${fileName}`);
            
            // Pause for 3 seconds to respect free-tier limits
            await delay(3000);
        } catch (error) {
            console.error(`❌ Failed to generate image for Post ${i + 1}:`, error.message);
        }
    }

    fs.writeFileSync(JSON_PATH, JSON.stringify(posts, null, 2));
    console.log("\n🚀 All background images downloaded and linked in daily_news.json!");
}

fetchBackgroundImages();