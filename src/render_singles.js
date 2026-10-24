import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Robust absolute paths constructed using process.cwd()
const TEMPLATES_DIR = path.join(process.cwd(), 'templates');
const RENDER_ENGINE_DIR = path.join(process.cwd(), 'services', 'render-engine');
const ASSETS_DIR = path.join(RENDER_ENGINE_DIR, 'assets');
const OUTPUT_DIR = path.join(RENDER_ENGINE_DIR, 'output');
const JSON_PATH = path.join(RENDER_ENGINE_DIR, 'daily_news.json');
const TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'single_template.html');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateSingleImages() {
    console.log("🚀 Firing up the Puppeteer Render Engine for Single Posts...");

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ daily_news.json missing at ${JSON_PATH}!`);
        return;
    }

    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error(`❌ single_template.html missing at ${TEMPLATE_PATH}!`);
        return;
    }

    const posts = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1350 });
    await page.setContent(templateHtml);

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        
        if (post.type === 'single' && post.slides && post.slides.length > 0) {
            console.log(`\n📸 Rendering Single Post ${i + 1}...`);
            
            const absoluteImagePath = path.join(ASSETS_DIR, `bg_${i + 1}.jpg`);
            let base64Image = '';
            
            // Convert the local image to a Base64 string to bypass browser security
            if (fs.existsSync(absoluteImagePath)) {
                const imageBuffer = fs.readFileSync(absoluteImagePath);
                base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            }

            const headline = post.slides[0].headline;
            const bodyText = post.slides[0].body || ""; // Grabs the new sub-description

            await page.evaluate((headlineText, bodyText, bgDataUrl) => {
                document.getElementById('title').innerHTML = headlineText || "";
                document.getElementById('content-body').innerHTML = bodyText || "";
                
                if (bgDataUrl) {
                    document.getElementById('bg-image').style.backgroundImage = `url('${bgDataUrl}')`;
                }
            }, headline, bodyText, base64Image);

            await delay(200);

            const fileName = `post_${i + 1}_single.png`;
            const filePath = path.join(OUTPUT_DIR, fileName);
            await page.screenshot({ path: filePath });
            
            console.log(`✅ Rendered ${fileName}`);
        }
    }

    await browser.close();
    console.log("\n🎯 All Single Posts successfully rendered to the output folder!");
}

generateSingleImages();