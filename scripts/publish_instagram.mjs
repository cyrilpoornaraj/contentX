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

// Recursively find all generated .png images anywhere in the project directory
function getAllPngs(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === 'node_modules' || file === '.git') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllPngs(filePath, fileList);
        } else if (file.endsWith('.png')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

async function publishToInstagram() {
    const rootDir = process.cwd();
    const pngPaths = getAllPngs(rootDir);

    if (pngPaths.length === 0) {
        throw new Error(`❌ No rendered .png images found anywhere in the repository!`);
    }

    // Sort paths numerically or alphabetically to keep order
    pngPaths.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    console.log(`📁 Found ${pngPaths.length} rendered images across the project.`);

    const jsonPath = path.join(rootDir, 'services', 'render-engine', 'daily_news.json');
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
    if (pngPaths.length === 1) {
        const relativePath = path.relative(rootDir, pngPaths[0]).replace(/\\/g, '/');
        console.log(`📸 Publishing Single Image Post: ${relativePath}`);
        const imageUrl = `${GITHUB_PAGES_BASE}/${relativePath}?t=${Date.now()}`;
        
        const container = await makeApiCall('media', { image_url: imageUrl, caption: caption });
        await new Promise(resolve => setTimeout(resolve, 5000));
        const publishData = await makeApiCall('media_publish', { creation_id: container.id });
        console.log('🎉 Single Post Successfully Published! ID:', publishData.id);
        return;
    }

    // Otherwise, publish as a Carousel
    console.log(`📸 Publishing Carousel with ${pngPaths.length} items...`);
    const itemContainerIds = [];

    for (let i = 0; i < pngPaths.length; i++) {
        const relativePath = path.relative(rootDir, pngPaths[i]).replace(/\\/g, '/');
        const imageUrl = `${GITHUB_PAGES_BASE}/${relativePath}?t=${Date.now()}`;
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