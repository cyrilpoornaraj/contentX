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

async function makeApiCall(endpoint, payload) {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, access_token: ACCESS_TOKEN }),
    });
    const data = await res.json();

    if (data.error) {
        throw new Error(`\n🚨 META API ERROR 🚨\nType: ${data.error.type}\nMessage: ${data.error.message}\nSubcode: ${data.error.error_subcode}`);
    }
    return data;
}

async function publishToInstagram() {
    // Check multiple possible output directories where render engines save images
    const possibleDirs = [
        path.join(process.cwd(), 'output'),
        path.join(process.cwd(), 'services', 'render-engine'),
        path.join(process.cwd(), 'services', 'content-engine')
    ];

    let targetDir = null;
    let files = [];

    for (const dir of possibleDirs) {
        if (fs.existsSync(dir)) {
            const pngs = fs.readdirSync(dir).filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
            if (pngs.length > 0) {
                targetDir = dir;
                files = pngs;
                break;
            }
        }
    }

    // If no directory was found with images, create default output directory and throw clear error
    if (!targetDir || files.length === 0) {
        const defaultOut = path.join(process.cwd(), 'output');
        if (!fs.existsSync(defaultOut)) {
            fs.mkdirSync(defaultOut, { recursive: true });
        }
        throw new Error(`❌ No rendered .png/.jpg images found in any output directory! Checked: ${possibleDirs.join(', ')}`);
    }

    // Sort images numerically
    files.sort((a, b) => {
        const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
        const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
        return numA - numB;
    });

    const folderName = path.basename(targetDir);
    console.log(`📁 Found ${files.length} rendered images in folder: ${folderName}`);

    const jsonPath = path.join(process.cwd(), 'services', 'render-engine', 'daily_news.json');
    let caption = 'Latest tech drop from @techseithigal 🚀\n\nFollow for more daily tech & AI updates!';
    if (fs.existsSync(jsonPath)) {
        try {
            const posts = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (posts.length > 0 && posts[0].caption) {
                caption = posts[0].caption;
            }
        } catch (e) {
            console.log('⚠️ Could not parse JSON caption, using default.');
        }
    }

    // If there is only 1 image (Single post)
    if (files.length === 1) {
        console.log('📸 Publishing Single Image Post...');
        const imageUrl = `${GITHUB_PAGES_BASE}/${folderName}/${files[0]}?t=${Date.now()}`;
        
        const container = await makeApiCall('media', { image_url: imageUrl, caption: caption });
        await new Promise(resolve => setTimeout(resolve, 5000));
        const publishData = await makeApiCall('media_publish', { creation_id: container.id });
        console.log('🎉 Single Post Successfully Published! ID:', publishData.id);
        return;
    }

    // Otherwise, publish as a Carousel
    console.log(`📸 Publishing Carousel with ${files.length} items...`);
    const itemContainerIds = [];

    for (let i = 0; i < files.length; i++) {
        const imageUrl = `${GITHUB_PAGES_BASE}/${folderName}/${files[i]}?t=${Date.now()}`;
        console.log(`Uploading container item: ${imageUrl}`);
        const data = await makeApiCall('media', { image_url: imageUrl, is_carousel_item: true });
        itemContainerIds.push(data.id);
    }

    const carouselData = await makeApiCall('media', {
        media_type: 'CAROUSEL',
        children: itemContainerIds,
        caption: caption
    });

    console.log('⏳ Waiting 10 seconds for Meta to process carousel container...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const publishData = await makeApiCall('media_publish', { creation_id: carouselData.id });
    console.log('🎉 Carousel Successfully Published! Post ID:', publishData.id);
}

publishToInstagram().catch(err => {
    console.error(err);
    process.exit(1);
});