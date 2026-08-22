import 'dotenv/config';

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ No API key found in .env");
        return;
    }

    console.log("Fetching available models from Google...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    console.log("\n✅ EXACT MODEL STRINGS YOU CAN USE:");
    data.models.forEach(model => {
        // We only want models that support text/JSON generation
        if (model.supportedGenerationMethods.includes("generateContent")) {
            console.log(`"${model.name.replace('models/', '')}"`);
        }
    });
}

checkModels();