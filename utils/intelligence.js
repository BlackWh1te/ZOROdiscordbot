const fs = require("fs");
const path = require("path");

const configFile = path.join(__dirname, "..", "data", "config.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadConfig() {
  ensureDataDir();
  if (!fs.existsSync(configFile)) {
    const defaultConfig = {
      autoLearn: true,
      autoModerate: false,
      autoWelcome: true,
      autoRespond: [],
      personality: "helpful",
      language: "en",
      timezone: "UTC",
      actionsRequireConfirm: false,
      maxHistory: 50,
      customCommands: {},
      permissions: {
        createChannel: true,
        createRole: true,
        kick: true,
        ban: true,
        manageRoles: true,
        manageChannels: true
      }
    };
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(configFile, "utf8"));
}

function saveConfig(config) {
  ensureDataDir();
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

function updateConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

function addAutoRespond(trigger, response, type = "exact") {
  const config = loadConfig();
  config.autoRespond.push({ trigger, response, type });
  saveConfig(config);
}

function getAutoRespond(message) {
  const config = loadConfig();
  for (const ar of config.autoRespond) {
    if (ar.type === "exact" && message === ar.trigger) return ar.response;
    if (ar.type === "contains" && message.toLowerCase().includes(ar.trigger.toLowerCase())) return ar.response;
  }
  return null;
}

function setPersonality(personality) {
  const personalities = {
    helpful: "You are a helpful, friendly AI assistant.",
    professional: "You are a professional, formal AI assistant.",
    casual: "You are a casual, friendly AI assistant who speaks casually.",
    witty: "You are a witty, clever AI assistant with humor.",
    serious: "You are a serious, business-focused AI assistant."
  };
  updateConfig("personality", personality);
  return personalities[personality] || personalities.helpful;
}

function getPermissions() {
  return loadConfig().permissions;
}

function hasPermission(action) {
  const perms = getPermissions();
  return perms[action] || false;
}

module.exports = {
  loadConfig,
  saveConfig,
  updateConfig,
  addAutoRespond,
  getAutoRespond,
  setPersonality,
  getPermissions,
  hasPermission
};