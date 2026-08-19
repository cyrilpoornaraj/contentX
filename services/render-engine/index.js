import ImageGenerator from './ImageGenerator.js';

async function main() {
    const renderer = new ImageGenerator();

    // Simulating the JSON output we get from the Gemini microservice
    const mockContent = {
        post_title: "Understanding Git Branches",
        slides: [
            "A branch is an isolated workspace for your code.",
            "Never commit directly to the 'main' branch.",
            "Use feature branches to build without breaking production."
        ]
    };

    try {
        console.log("Starting Render Engine Pipeline...");

        // Render the title slide
        await renderer.createSlide(mockContent.post_title, "Swipe to learn how to keep your code safe.", 0);

        // Loop through the slides array and render each one
        for (let i = 0; i < mockContent.slides.length; i++) {
            await renderer.createSlide(`Tip #${i + 1}`, mockContent.slides[i], i + 1);
        }

        console.log("🎉 All carousel images rendered successfully!");
    } catch (error) {
        console.error("Render Engine Failed:", error);
    }
}

main();