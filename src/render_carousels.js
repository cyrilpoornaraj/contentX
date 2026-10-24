import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Robust absolute paths constructed using process.cwd()
const TEMPLATES_DIR = path.join(process.cwd(), 'templates');
const RENDER_ENGINE_DIR = path.join(process.cwd(), 'services', 'render-engine');
const ASSETS_DIR = path.join(RENDER_ENGINE_DIR, 'assets');
const OUTPUT_DIR = path.join(RENDER_ENGINE_DIR, 'output');
const JSON_PATH = path.join(RENDER_ENGINE_DIR, 'daily_news.json');
const TEMPLATE_PATH = path.join(TEMPLATES_DIR, 'carousel_template.html');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function generateCarouselImages() {
    console.log("🚀 Firing up the Puppeteer Render Engine for Carousels...");

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (!fs.existsSync(JSON_PATH)) {
        console.error(`❌ daily_news.json missing at ${JSON_PATH}!`);
        return;
    }

    if (!fs.existsSync(TEMPLATE_PATH)) {
        console.error(`❌ carousel_template.html missing at ${TEMPLATE_PATH}!`);
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

        if (post.type === 'carousel' && post.slides && post.slides.length > 0) {
            console.log(`\n📸 Rendering Carousel for Post ${i + 1}...`);

            const carouselDir = path.join(OUTPUT_DIR, `post_${i + 1}_carousel`);
            if (!fs.existsSync(carouselDir)) fs.mkdirSync(carouselDir, { recursive: true });

            const absoluteImagePath = path.join(ASSETS_DIR, `bg_${i + 1}.jpg`);
            let base64Image = '';
            if (fs.existsSync(absoluteImagePath)) {
                const imageBuffer = fs.readFileSync(absoluteImagePath);
                base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
            }

            const totalSlides = post.slides.length;

            for (let j = 0; j <= totalSlides; j++) {
                const isCover = (j === 0);
                const isCTA = (j === totalSlides);
                const slide = isCTA ? {} : post.slides[j];

                await page.evaluate(({ headline, body, bgDataUrl, isCover, isCTA }) => {
                    const container = document.getElementById('slide-container');
                    const bgDiv = document.getElementById('bg-image');
                    const overlay = document.querySelector('.overlay');
                    const brandTag = document.getElementById('brand-tag');
                    const titleDiv = document.getElementById('title');
                    const storyDiv = document.getElementById('story-body');
                    const ctaBlock = document.getElementById('cta-block');
                    const swipeTag = document.getElementById('swipe-tag');
                    const footerHandle = document.getElementById('footer-handle');

                    if (isCover) {
                        container.style.display = 'flex';
                        container.className = 'slide-container cover-layout';
                        
                        if (bgDataUrl) {
                            bgDiv.style.backgroundImage = `url('${bgDataUrl}')`;
                            bgDiv.style.display = 'block';
                            overlay.style.display = 'block';
                        }
                        brandTag.style.display = 'block';
                        titleDiv.innerHTML = headline || "";
                        titleDiv.style.display = 'block';
                        storyDiv.style.display = 'none';
                        ctaBlock.style.display = 'none';
                        swipeTag.style.display = 'flex';
                        footerHandle.style.display = 'none';
                        
                    } else if (isCTA) {
                        // CTA Page: Reactivate background image & hide unnecessary elements
                        if (bgDataUrl) {
                            bgDiv.style.backgroundImage = `url('${bgDataUrl}')`;
                            bgDiv.style.display = 'block';
                            overlay.style.display = 'block';
                        }
                        
                        container.style.display = 'none';
                        swipeTag.style.display = 'none';
                        footerHandle.style.display = 'none'; // Hidden because pill is shown
                        
                        ctaBlock.style.display = 'flex';
                        
                    } else {
                        // Story Pages: Pure Black
                        document.body.style.background = '#000000';
                        container.style.display = 'flex';
                        container.className = 'slide-container content-layout';
                        
                        bgDiv.style.display = 'none';
                        overlay.style.display = 'none';
                        brandTag.style.display = 'none';
                        titleDiv.style.display = 'none';
                        swipeTag.style.display = 'none';
                        ctaBlock.style.display = 'none';
                        
                        storyDiv.innerHTML = body || headline || "";
                        storyDiv.style.display = 'block';
                        footerHandle.style.display = 'block';
                    }
                }, {
                    headline: slide.headline,
                    body: slide.body,
                    bgDataUrl: base64Image,
                    isCover,
                    isCTA
                });

                await delay(180);

                const fileName = `slide_${j + 1}.png`;
                const filePath = path.join(carouselDir, fileName);
                await page.screenshot({ path: filePath });

                console.log(`✅ Rendered ${fileName}${isCover ? ' (Cover)' : isCTA ? ' (Dedicated CTA)' : ''}`);
            }
        }
    }

    await browser.close();
    console.log("\n🎯 All Carousel slides updated and rendered!");
}

generateCarouselImages();