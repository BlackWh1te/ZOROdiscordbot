const https = require("https");

let pendingSelection = new Map();

function setPending(userId, data) {
  pendingSelection.set(userId, data);
}

function getPending(userId) {
  return pendingSelection.get(userId);
}

function clearPending(userId) {
  pendingSelection.delete(userId);
}

async function searchRepos(query, limit = 10) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: "/search/repositories?q=" + encodeURIComponent(query) + "&per_page=" + limit,
      method: "GET",
      headers: {
        "User-Agent": "zoroBOT/1.0",
        "Accept": "application/vnd.github.v3+json"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.items) {
            resolve(json.items.map((repo, i) => ({
              index: i + 1,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description || "No description",
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language || "Unknown",
              url: repo.html_url,
              readmeUrl: repo.url + "/readme",
              releaseUrl: repo.url + "/releases/latest",
              updated: repo.updated_at
            })));
          } else {
            resolve([]);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function fetchReadme(repoUrl, ollama) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: "/repos/" + repoUrl.replace("https://github.com/", "") + "/readme",
      method: "GET",
      headers: {
        "User-Agent": "zoroBOT/1.0",
        "Accept": "application/vnd.github.v3.raw"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        if (ollama) {
          ollama.generate("Analyze this README and extract: Project name, key features (3-5 bullet points), dependencies, how to use/install, and if there are any security concerns or notes:\n\n" + data.substring(0, 5000))
            .then(analysis => resolve({ raw: data.substring(0, 2000), analysis }))
            .catch(() => resolve({ raw: data.substring(0, 2000), analysis: null }));
        } else {
          resolve({ raw: data.substring(0, 2000), analysis: null });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function checkRelease(repoUrl) {
  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: "/repos/" + repoUrl.replace("https://github.com/", "") + "/releases/latest",
      method: "GET",
      headers: {
        "User-Agent": "zoroBOT/1.0",
        "Accept": "application/vnd.github.v3+json"
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        try {
          const release = JSON.parse(data);
          if (release.tag_name) {
            resolve({
              version: release.tag_name,
              name: release.name || release.tag_name,
              url: release.html_url,
                  assets: release.assets?.map(a => ({ name: a.name, url: a.browser_download_url })) || []
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on("error", () => resolve(null));
    req.end();
  });
}

function formatSearchResults(repos) {
  let msg = "🔍 **Search Results:**\n━━━━━━━━━━━━━━━━━━━━\n\n";
  repos.forEach(r => {
    msg += `#${r.index} **${r.name}**\n`;
    msg += `   ⭐ ${r.stars} | 🍴 ${r.forks} | 💻 ${r.language}\n`;
    msg += `   ${r.description.substring(0, 60)}${r.description.length > 60 ? "..." : ""}\n\n`;
  });
  msg += "━━━━━━━━━━━━━━━━━━━━\n💡 Reply with #number to select (e.g., #1)";
  return msg;
}

function formatAnalysis(readme, release) {
  let msg = "📦 **Project Analysis:**\n━━━━━━━━━━━━━━━━━━━━\n\n";
  
  if (readme.analysis) {
    msg += readme.analysis + "\n\n";
  } else {
    msg += readme.raw + "\n\n";
  }
  
  if (release) {
    msg += "📦 **Latest Release:**\n";
    msg += `Version: ${release.version}\n`;
    msg += `${release.url}\n`;
    if (release.assets.length > 0) {
      msg += "📥 **Downloads:**\n";
      release.assets.forEach(a => {
        msg += `- [${a.name}](${a.url})\n`;
      });
    }
  }
  
  return msg;
}

module.exports = { searchRepos, fetchReadme, checkRelease, formatSearchResults, formatAnalysis, setPending, getPending, clearPending };