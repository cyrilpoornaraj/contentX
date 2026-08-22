import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoGenerator {
    constructor() {
        this.outputDir = path.join(__dirname, 'output');

        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir);
        } else {
            const files = fs.readdirSync(this.outputDir);
            for (const file of files) {
                const filePath = path.join(this.outputDir, file);
                if (fs.lstatSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                }
            }
            console.log("🧹 Cleared old reels from the output folder.");
        }
    }

    async createReel(reelData, fileName = 'reel_1.mp4') {
        console.log(`[VideoGenerator] Compiling ${fileName} in the background...`);
        console.log(`[VideoGenerator] This may take a minute depending on your CPU.`);

        const outputPath = path.join(this.outputDir, fileName);
        const tempPropsPath = path.join(__dirname, 'temp_props.json');

        // 1. Write the dynamic AI data to a temporary JSON file
        fs.writeFileSync(tempPropsPath, JSON.stringify(reelData));

        try {
            // 2. Trigger Remotion's headless renderer
            // (Assuming the default composition is named 'MyComp' - we will update this next)
            const command = `npx remotion render src/index.ts MyComp ${outputPath} --props=${tempPropsPath}`;

            await execPromise(command, { cwd: __dirname });

            console.log(`✅ Video saved successfully to ${outputPath}`);
        } catch (error) {
            console.error(`❌ Video rendering failed:`, error.message);
        } finally {
            // 3. Clean up the temporary file
            if (fs.existsSync(tempPropsPath)) {
                fs.unlinkSync(tempPropsPath);
            }
        }

        return outputPath;
    }
}

export default VideoGenerator;