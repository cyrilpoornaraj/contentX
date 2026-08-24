import fs from 'fs';
import path from 'path';

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const BASE_URL = `https://graph.facebook.com/v20.0/${IG_USER_ID}`;
const GITHUB_PAGES_BASE = 'https://cyrilpoornaraj.github.io/contentX';

if (!ACCESS_TOKEN || !IG_USER_ID) {
    console.error('❌ Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID');
    process.exit(1);
}

// Helper: Make API calls and automatically catch hidden Meta errors
async function makeApiCall(endpoint, payload) {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: ACCESS_TOKEN }),
    });
    const data = await res.json();

    if (data.error) {
        throw new Error(`\n🚨 META API ERROR 🚨\nType: ${data.error.type}\nMessage: ${data.error.message}\nSubcode: ${data.error.error_subcode}\nUser Msg: ${data.error.error_user_msg || 'N/A'}`);
    }
    return data;
}

async function waitForContainer(containerId) {
    let status = 'IN_PROGRESS';
    let attempts = 0;
    while (status === 'IN_PROGRESS' && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const res = await fetch(`https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${ACCESS_TOKEN}`);
        const data = await res.json();
        status = data.status_code;
        if (status === 'ERROR') throw new Error(`Meta media processing error: ${JSON.stringify(data)}`);
        attempts++;
    }
}

async function publishCarousel() {
    const metadataPath = path.join('deploy_media', 'metadata.json');
    let caption = 'Day of DSA Mastery 🚀\n\nComment DSA to get the complete problem breakdown notes!';

    if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        const baseCap = metadata.carousel_caption || metadata.caption || '';
        const tags = metadata.hashtags || '';
        caption = `${baseCap}\n\n.\n.\n.\n${tags}`.trim();
    }

    let slideCount = 0;
    while (fs.existsSync(path.join('deploy_media', `slide_${slideCount + 1}.png`))) {
        slideCount++;
    }

    if (slideCount === 0) throw new Error('❌ No slides found in the deploy_media folder!');
    console.log(`📸 Found ${slideCount} slides to publish!`);

    console.log('1️⃣ Creating Carousel Item Containers...');
    const itemContainerIds = [];
    for (let i = 1; i <= slideCount; i++) {
        const url = `${GITHUB_PAGES_BASE}/slide_${i}.png?t=${Date.now()}`;
        const data = await makeApiCall('media', { image_url: url, is_carousel_item: true });
        itemContainerIds.push(data.id);
    }

    console.log('2️⃣ Creating Parent Carousel Container...');
    const carouselData = await makeApiCall('media', {
        media_type: 'CAROUSEL',
        children: itemContainerIds,
        caption: caption
    });

    // Wait 10 seconds before publishing (Sometimes Meta needs a moment to process the parent container)
    console.log('⏳ Waiting 10 seconds for Meta to process the carousel...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('3️⃣ Publishing Carousel to Feed...');
    const publishData = await makeApiCall('media_publish', { creation_id: carouselData.id });

    console.log('🎉 Carousel Successfully Published! Post ID:', publishData.id);
}

async function publishReel() {
    // ... (Keep your existing publishReel logic here for now, or update it with makeApiCall later)
    console.log("Reel logic goes here");
}

const target = process.argv[2];
if (target === 'carousel') await publishCarousel();
else if (target === 'reel') await publishReel();
else console.error('Specify "carousel" or "reel" as argument.');