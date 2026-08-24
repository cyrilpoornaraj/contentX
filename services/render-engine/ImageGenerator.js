import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageGenerator {
    constructor() {
        this.templatePath = path.join(__dirname, 'template.html');
        this.outputDir = path.join(__dirname, 'output');

        // Ensure directory exists, or clear it if it already does
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
        } else {
            // Read all files in the directory and delete them
            const files = fs.readdirSync(this.outputDir);
            for (const file of files) {
                // Only delete files (prevents errors if a hidden folder gets in there)
                const filePath = path.join(this.outputDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
            console.log("🧹 Cleared old slides from the output folder.");
        }
    }

    async createSlide(title, content, slideNumber, tag = "SYSTEM DESIGN", isLastSlide = false) {
        console.log(`[ImageGenerator] Rendering slide ${slideNumber}...`);

        let html = fs.readFileSync(this.templatePath, 'utf8');

        // Apply bold highlighting to the title
        const formattedTitle = title.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>');

        // Format content as bullet points if it's an array, otherwise wrap in paragraph
        let formattedContent = '';
        if (Array.isArray(content)) {
            formattedContent = '<ul>' + content.map(item => `<li>${item.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>')}</li>`).join('') + '</ul>';
        } else {
            formattedContent = `<p>${content.replace(/\*\*(.*?)\*\*/g, '<span class="highlight">$1</span>')}</p>`;
        }

        // Hide swipe indicator on the last slide
        const swipeHtml = isLastSlide ? '' : '<div class="swipe-indicator">Swipe <span class="pill">➔</span></div>';

        html = html.replace('{{TITLE}}', formattedTitle);
        html = html.replace('{{CONTENT}}', formattedContent);
        html = html.replace('{{TAG}}', tag);
        html = html.replace('{{SWIPE_INDICATOR}}', swipeHtml);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        await page.setViewport({ width: 1080, height: 1440 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const outputPath = path.join(this.outputDir, `slide_${slideNumber}.png`);
        await page.screenshot({ path: outputPath });

        await browser.close();
        console.log(`✅ Slide ${slideNumber} saved to ${outputPath}`);

        return outputPath;
    }
}

export default ImageGenerator;