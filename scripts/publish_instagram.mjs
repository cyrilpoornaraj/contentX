import fs from 'fs';
import path from 'path';

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const BASE_URL = `https://graph.facebook.com/v20.0/${IG_USER_ID}`;
// The files will now be at the root of your GitHub Pages link
const GITHUB_PAGES_BASE = 'https://cyrilpoornaraj.github.io/contentX';

if (!ACCESS_TOKEN || !IG_USER_ID) {
  console.error('❌ Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID');
  process.exit(1);
}

async function waitForContainer(containerId) {
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${ACCESS_TOKEN}`
    );
    const data = await res.json();
    status = data.status_code;
    if (status === 'ERROR') throw new Error(`Meta media processing error: ${JSON.stringify(data)}`);
    attempts++;
  }
}

async function publishCarousel() {
  // Look for metadata locally in the render engine output folder
  const metadataPath = path.join('services', 'render-engine', 'output', 'metadata.json');
  let caption = 'Day of DSA Mastery 🚀\n\nComment DSA to get the complete problem breakdown notes!';
  
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const baseCap = metadata.carousel_caption || metadata.caption || '';
    const tags = metadata.hashtags || '';
    caption = `${baseCap}\n\n.\n.\n.\n${tags}`.trim();
  }

  // 5 slides fetched directly from the GitHub Pages root
  const imageUrls = [1, 2, 3, 4, 5].map(
    (num) => `${GITHUB_PAGES_BASE}/slide_${num}.png?t=${Date.now()}`
  );

  console.log('1️⃣ Creating Carousel Item Containers...');
  const itemContainerIds = [];
  for (const url of imageUrls) {
    const res = await fetch(`${BASE_URL}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: ACCESS_TOKEN }),
    });
    const data = await res.json();
    if (!data.id) throw new Error(`Failed to create item container: ${JSON.stringify(data)}`);
    itemContainerIds.push(data.id);
  }

  console.log('2️⃣ Creating Parent Carousel Container...');
  const carouselRes = await fetch(`${BASE_URL}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'CAROUSEL', children: itemContainerIds, caption: caption, access_token: ACCESS_TOKEN }),
  });
  const carouselData = await carouselRes.json();
  
  console.log('3️⃣ Publishing Carousel to Feed...');
  const publishRes = await fetch(`${BASE_URL}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carouselData.id, access_token: ACCESS_TOKEN }),
  });
  const publishData = await publishRes.json();
  console.log('🎉 Carousel Successfully Published! Post ID:', publishData.id);
}

async function publishReel() {
  const metadataPath = path.join('services', 'render-engine', 'output', 'metadata.json');
  let caption = 'Master DSA in 20 seconds ⏱️🔥\n\nComment DSA for source code and roadmap!';
  
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const baseCap = metadata.reel_caption || metadata.caption || '';
    const tags = metadata.hashtags || '';
    caption = `${baseCap}\n\n.\n.\n.\n${tags}`.trim();
  }

  const videoUrl = `${GITHUB_PAGES_BASE}/daily_reel.mp4?t=${Date.now()}`;

  console.log('1️⃣ Creating Reel Container...');
  const res = await fetch(`${BASE_URL}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'REELS', video_url: videoUrl, caption: caption, share_to_feed: true, access_token: ACCESS_TOKEN }),
  });
  const data = await res.json();
  
  console.log('2️⃣ Waiting for Meta video processing...');
  await waitForContainer(data.id);

  console.log('3️⃣ Publishing Reel to Feed...');
  const publishRes = await fetch(`${BASE_URL}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: data.id, access_token: ACCESS_TOKEN }),
  });
  const publishData = await publishRes.json();
  console.log('🎉 Reel Successfully Published! Post ID:', publishData.id);
}

const target = process.argv[2];
if (target === 'carousel') await publishCarousel();
else if (target === 'reel') await publishReel();
else console.error('Specify "carousel" or "reel" as argument.');