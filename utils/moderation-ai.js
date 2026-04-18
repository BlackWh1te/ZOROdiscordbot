const fs = require("fs");
const path = require("path");

const modFile = path.join(__dirname, "..", "data", "moderation.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadMod() {
  ensureDataDir();
  if (!fs.existsSync(modFile)) {
    const defaultData = {
      enabled: false,
      logChannel: null,
      blockedWords: [],
      blockedPatterns: [],
      autoDelete: true,
      warnOnProfanity: true,
      autoBanPhrases: [],
      actionThresholds: {
        warn: 3,
        kick: 5,
        ban: 10
      },
      whitelistedUsers: [],
      ignoredChannels: [],
      history: [],
      stats: { warnings: 0, kicks: 0, bans: 0, deleted: 0 }
    };
    fs.writeFileSync(modFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(modFile, "utf8"));
}

function saveMod(data) {
  ensureDataDir();
  fs.writeFileSync(modFile, JSON.stringify(data, null, 2));
}

function analyzeMessage(message, ollama) {
  return new Promise(async (resolve) => {
    try {
      const prompt = `Analyze this Discord message for moderation issues:
Message: "${message}"

Return JSON:
{
  "safe": true/false,
  "issues": ["spam", "profanity", "scam", "harassment", "illegal", "none"],
  "severity": 0-10,
  "action": "none" | "warn" | "delete" | "kick" | "ban"
}

Be strict for safety issues.`;

      const result = await ollama.generate(prompt);
      try {
        const match = result.match(/\{[\s\S]*\}/);
        if (match) {
          resolve(JSON.parse(match[0]));
        }
      } catch {}
      resolve({ safe: true, issues: [], severity: 0, action: "none" });
    } catch (e) {
      resolve({ safe: true, issues: [], severity: 0, action: "none" });
    }
  });
}

function logAction(action, user, reason) {
  const mod = loadMod();
  const entry = { action, user, reason, time: Date.now() };
  mod.history.push(entry);
  if (mod.history.length > 100) mod.history = mod.history.slice(-100);

  mod.stats[action + "s"] = (mod.stats[action + "s"] || 0) + 1;
  saveMod(mod);
}

function addBlockedWord(word) {
  const mod = loadMod();
  if (!mod.blockedWords.includes(word.toLowerCase())) {
    mod.blockedWords.push(word.toLowerCase());
    saveMod(mod);
  }
}

function removeBlockedWord(word) {
  const mod = loadMod();
  mod.blockedWords = mod.blockedWords.filter(w => w !== word.toLowerCase());
  saveMod(mod);
}

function getStats() {
  return loadMod().stats;
}

function getHistory(limit = 10) {
  const mod = loadMod();
  return mod.history.slice(-limit);
}

function setLogChannel(channelId) {
  const mod = loadMod();
  mod.logChannel = channelId;
  saveMod(mod);
}

function toggleEnabled(enabled) {
  const mod = loadMod();
  mod.enabled = enabled;
  saveMod(mod);
}

module.exports = {
  loadMod,
  saveMod,
  analyzeMessage,
  logAction,
  addBlockedWord,
  removeBlockedWord,
  getStats,
  getHistory,
  setLogChannel,
  toggleEnabled
};