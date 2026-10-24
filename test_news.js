import Parser from 'rss-parser';
const parser = new Parser();

async function fetchTechNews() {
    console.log("📡 Fetching live tech news...");
    try {
        // TechCrunch RSS Feed
        const feed = await parser.parseURL('https://techcrunch.com/feed/');
        
        // Grab the top 5 latest articles for your 5 daily posts
        const topStories = feed.items.slice(0, 5).map((item, index) => ({
            id: index + 1,
            title: item.title,
            summary: item.contentSnippet || item.content,
            link: item.link
        }));

        console.log("\n✅ Successfully fetched today's top 5 stories:\n");
        console.log(JSON.stringify(topStories, null, 2));
        
    } catch (error) {
        console.error("❌ Failed to fetch news:", error.message);
    }
}

fetchTechNews();