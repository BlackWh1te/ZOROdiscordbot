const fs = require("fs");
const path = require("path");

const knowledgeFile = path.join(__dirname, "..", "data", "knowledge.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadKnowledge() {
  ensureDataDir();
  if (!fs.existsSync(knowledgeFile)) {
    const defaultData = {
      serverName: "",
      rules: [],
      channels: [],
      roles: [],
      customInfo: {}
    };
    fs.writeFileSync(knowledgeFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(knowledgeFile, "utf8"));
}

function saveKnowledge(data) {
  ensureDataDir();
  fs.writeFileSync(knowledgeFile, JSON.stringify(data, null, 2));
}

function updateKnowledge(key, value) {
  const data = loadKnowledge();
  data[key] = value;
  saveKnowledge(data);
}

function addRule(rule) {
  const data = loadKnowledge();
  data.rules.push(rule);
  saveKnowledge(data);
}

function addChannel(name, purpose) {
  const data = loadKnowledge();
  data.channels.push({ name, purpose });
  saveKnowledge(data);
}

function addRole(name, description) {
  const data = loadKnowledge();
  data.roles.push({ name, description });
  saveKnowledge(data);
}

function getSystemPrompt(guild) {
  const data = loadKnowledge();
  let prompt = `You are DSbot, a helpful AI assistant in the Discord server "${data.serverName || guild.name}".\n`;

  if (data.rules.length > 0) {
    prompt += `\nServer Rules:\n${data.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}\n`;
  }

  if (data.channels.length > 0) {
    prompt += `\nServer Channels:\n${data.channels.map(c => `- #${c.name}: ${c.purpose}`).join("\n")}\n`;
  }

  if (data.roles.length > 0) {
    prompt += `\nServer Roles:\n${data.roles.map(r => `- @${r.name}: ${r.description}`).join("\n")}\n`;
  }

  if (Object.keys(data.customInfo).length > 0) {
    prompt += `\nAdditional Info:\n${JSON.stringify(data.customInfo, null, 2)}\n`;
  }

  prompt += `\nBe helpful and friendly. Use this knowledge to answer questions about the server.`;
  return prompt;
}

module.exports = { loadKnowledge, updateKnowledge, addRule, addChannel, addRole, getSystemPrompt };