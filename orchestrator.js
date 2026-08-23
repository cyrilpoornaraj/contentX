import 'dotenv/config';
import fs from 'fs';
import { execSync } from 'child_process';
import GeminiService from './services/content-engine/GeminiService.js';
import ContentGenerator from './services/content-engine/ContentGenerator.js';
import ImageGenerator from './services/render-engine/ImageGenerator.js';

async function runPipeline() {
    console.log("🚀 Starting Daily Instagram Automation Pipeline...");

    // --- 1. THE 365-DAY PROCEDURAL CURRICULUM ---
    const dsaMonths = [
        "Month 1: Arrays as Lego Blocks and Toy Boxes",
        "Month 2: Linked Lists as Treasure Hunts and Scavenger Clues",
        "Month 3: Stacks as Pancake Stacks and Queues as Theme Park Lines",
        "Month 4: Hash Maps as Magic Lockers with Secret Keys",
        "Month 5: Two Pointers as Racing Toy Cars",
        "Month 6: Sliding Window as a Moving Magnifying Glass",
        "Month 7: Recursion as Russian Nesting Dolls",
        "Month 8: Trees as Family Trees and River Branches",
        "Month 9: Binary Search as Guess-Who Games",
        "Month 10: Graphs as City Road Maps for Hot Wheels",
        "Month 11: Sorting Algorithms as Organizing a Messy Playroom",
        "Month 12: Dynamic Programming as Remembering Past Puzzles"
    ];

    const progressFile = './dsa_day.txt';
    let dayOfYear = 1;

    // Read the current day from the text file (if it exists)
    if (fs.existsSync(progressFile)) {
        dayOfYear = parseInt(fs.readFileSync(progressFile, 'utf8'));
    }

    // Automatically shift to the next theme every 30 days (loops back after 360 days)
    const monthIndex = Math.floor((dayOfYear - 1) / 30) % 12;
    const currentTheme = dsaMonths[monthIndex];

    // The dynamic super-prompt for the AI
    const topic = `Day ${dayOfYear} of 365. Theme: ${currentTheme}. Invent a highly specific, unique daily micro-lesson for today.`;

    console.log(`📚 [Curriculum Tracker] Generating content for Day ${dayOfYear} / 365`);
    console.log(`🎯 [Theme] ${currentTheme}`);

    // --- 2. INITIALIZE SERVICES ---
    const aiService = new GeminiService();
    const contentGenerator = new ContentGenerator(aiService);

    try {
        console.log("\n[STAGE 1] Triggering Content Engine...");
        const result = await contentGenerator.createDailyPost(topic);
        console.log(`✅ Script Generated: "${result.reel_script.reel_title}"`);

        // --- 3. RENDER CAROUSEL ---
        console.log("\n[STAGE 2A] Triggering Image Engine (Carousel)...");
        // Your class automatically clears the old slides in its constructor!
        const imageGen = new ImageGenerator();

        const carousel = result.carousel_data;
        const tag = "DATA STRUCTURES & ALGORITHMS"; // Overriding your default "SYSTEM DESIGN" tag

        // Render Slide 0 (The Title Cover)
        await imageGen.createSlide(carousel.post_title, "Swipe to explore →", 0, tag, false);

        // Loop through and render the educational content slides
        for (let i = 0; i < carousel.slides.length; i++) {
            const slide = carousel.slides[i];
            const isLast = (i === carousel.slides.length - 1);

            // Render each slide using your function
            await imageGen.createSlide(slide.slide_title, slide.bullet_points, i + 1, tag, isLast);
        }
        console.log("✅ Carousel rendered successfully.");

        // --- 4. RENDER REEL ---
        console.log("\n[STAGE 2B] Triggering Video Engine (Reel)...");

        const videoPublicDir = './services/video-engine/public';
        if (!fs.existsSync(videoPublicDir)) {
            fs.mkdirSync(videoPublicDir, { recursive: true });
        }

        // 🎵 SHUFFLE BGM: Pick a random track between 1 and 5
        const randomTrackNumber = Math.floor(Math.random() * 5) + 1;
        result.reel_script.bgm_track = `bgm${randomTrackNumber}.mp3`;
        console.log(`🎵 Selected Background Music: ${result.reel_script.bgm_track}`);

        // Write the JSON data to a file so Remotion can grab it during the build
        fs.writeFileSync(`${videoPublicDir}/reel_data.json`, JSON.stringify(result.reel_script, null, 2));

        // Execute the Remotion render command
        console.log("⏳ Compiling daily_reel.mp4 in the background...");
        execSync('npx --package=@remotion/cli remotion render MyComp out/daily_reel.mp4 --props=public/reel_data.json', {
            cwd: './services/video-engine',
            stdio: 'inherit'
        });
        console.log("✅ Video rendered successfully.");

        // --- 5. SAVE PROGRESS FOR TOMORROW ---
        fs.writeFileSync(progressFile, (dayOfYear + 1).toString());
        console.log(`\n✅ Pipeline Complete! Progress saved. Tomorrow will teach Day ${dayOfYear + 1}.`);

    } catch (error) {
        console.error("\n❌ Pipeline Failed:", error);
        process.exit(1);
    }
}

runPipeline();