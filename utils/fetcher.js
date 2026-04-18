const https = require("https");

function fetchCS2News() {
  return new Promise(async (resolve, reject) => {
    const query = "CS2 CS:GO Counter-Strike 2 news 2025 2026";
    
    const options = {
      hostname: "api.allorigins.win",
      path: "/raw?url=" + encodeURIComponent("https://www.google.com/search?q=" + encodeURIComponent(query) + "&num=5"),
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        const titles = [];
        const titleRegex = /<h3 class="zBAqLc">(.*?)<\/h3>|<div class="BNeawe vvjwJb">(.*?)<\/div>/g;
        let match;
        while ((match = titleRegex.exec(data)) !== null && titles.length < 3) {
          const title = match[1] || match[2];
          if (title && !title.includes("...")) {
            titles.push(title.replace(/<[^>]+>/g, "").trim());
          }
        }
        if (titles.length === 0) {
          const fallback = data.match(/<h3[^>]*>(.*?)<\/h3>/g)?.slice(0, 3).map(m => m.replace(/<[^>]+>/g, ""));
          resolve(fallback || ["No recent CS2 news found"]);
        } else {
          resolve(titles);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function formatNewsMessage(news) {
  if (typeof news === "string") {
    return news;
  }
  if (Array.isArray(news)) {
    return "📰 **CS2 NEWS**\n━━━━━━━━━━━━━━━━━━━━\n\n" + 
      news.map((n, i) => `${i + 1}. ${n}`).join("\n\n") +
      "\n\n━━━━━━━━━━━━━━━━━━━━";
  }
  return "📰 **CS2 NEWS**\nCheck the channel for updates!";
}

module.exports = { fetchCS2News, formatNewsMessage };