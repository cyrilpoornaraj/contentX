import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

class ImageGenerator {
    constructor() {
        this.templatePath = path.resolve('./template.html');
        // Create an output folder for the images if it doesn't exist
        this.outputDir = path.resolve('./output');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
        }
    }

    async createSlide(title, content, slideNumber, tag = "SYSTEM ARCHITECTURE") {
        console.log(`[ImageGenerator] Rendering slide ${slideNumber}...`);

        // 1. Read the raw HTML file
        let html = fs.readFileSync(this.templatePath, 'utf8');

        // 2. Added styling for dynamic bolding/coloring (replaces **text** with highlighted span)
        const formattedTitle = title.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>');

        // 3. Replace the placeholders with the actual dynamic content
        html = html.replace('{{TITLE}}', formattedTitle);
        html = html.replace('{{CONTENT}}', content);
        html = html.replace('{{TAG}}', tag);

        // 4. Launch the headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // 5. Set the viewport exactly to Instagram's square resolution
        await page.setViewport({ width: 1080, height: 1080 });

        // 6. Load the injected HTML into the browser
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // 7. Take the screenshot and save it
        const outputPath = path.join(this.outputDir, `slide_${slideNumber}.png`);
        await page.screenshot({ path: outputPath });

        await browser.close();
        console.log(`✅ Slide ${slideNumber} saved to ${outputPath}`);

        return outputPath;
    }
}

export default ImageGenerator;