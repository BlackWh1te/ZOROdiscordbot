const fs = require("fs");
const path = require("path");

const xpFile = path.join(__dirname, "..", "data", "xp.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadXP() {
  ensureDataDir();
  if (!fs.existsSync(xpFile)) return {};
  return JSON.parse(fs.readFileSync(xpFile, "utf8"));
}

function saveXP(xp) {
  ensureDataDir();
  fs.writeFileSync(xpFile, JSON.stringify(xp, null, 2));
}

function addXP(guildId, userId, amount) {
  const xp = loadXP();
  const key = `${guildId}_${userId}`;

  if (!xp[key]) xp[key] = { xp: 0, level: 1 };
  xp[key].xp += amount;

  const xpNeeded = xp[key].level * 100;
  if (xp[key].xp >= xpNeeded) {
    xp[key].xp -= xpNeeded;
    xp[key].level++;
  }

  saveXP(xp);
  return xp[key];
}

function getXP(guildId, userId) {
  const xp = loadXP();
  const key = `${guildId}_${userId}`;
  return xp[key] || { xp: 0, level: 1 };
}

function getLeaderboard(guildId, limit = 10) {
  const xp = loadXP();
  return Object.entries(xp)
    .filter(([key]) => key.startsWith(guildId))
    .map(([key, val]) => ({ userId: key.split("_")[1], ...val }))
    .sort((a, b) => b.xp + b.level * 100 - (a.xp + a.level * 100))
    .slice(0, limit);
}

module.exports = { addXP, getXP, getLeaderboard };