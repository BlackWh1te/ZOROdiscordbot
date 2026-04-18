const fs = require("fs");
const path = require("path");

const warnFile = path.join(__dirname, "..", "data", "warns.json");
const banFile = path.join(__dirname, "..", "data", "bans.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadWarns() {
  ensureDataDir();
  if (!fs.existsSync(warnFile)) return {};
  return JSON.parse(fs.readFileSync(warnFile, "utf8"));
}

function saveWarns(warns) {
  ensureDataDir();
  fs.writeFileSync(warnFile, JSON.stringify(warns, null, 2));
}

function warnUser(guildId, userId, reason, moderator) {
  const warns = loadWarns();
  const key = `${guildId}_${userId}`;

  if (!warns[key]) warns[key] = [];
  warns[key].push({ reason, moderator, date: new Date().toISOString() });

  saveWarns(warns);
  return warns[key].length;
}

function getWarns(guildId, userId) {
  const warns = loadWarns();
  const key = `${guildId}_${userId}`;
  return warns[key] || [];
}

function clearWarns(guildId, userId) {
  const warns = loadWarns();
  const key = `${guildId}_${userId}`;
  delete warns[key];
  saveWarns(warns);
}

module.exports = { warnUser, getWarns, clearWarns };