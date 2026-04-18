const fs = require("fs");
const path = require("path");

const mlFile = path.join(__dirname, "..", "data", "ml.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadML() {
  ensureDataDir();
  if (!fs.existsSync(mlFile)) {
    const defaultData = {
      patterns: {},
      responses: {},
      actions: {},
      corrections: [],
      successCount: {},
      failedCount: {},
      userPreferences: {},
      learnedFacts: [],
      actionHistory: []
    };
    fs.writeFileSync(mlFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(mlFile, "utf8"));
}

function saveML(data) {
  ensureDataDir();
  fs.writeFileSync(mlFile, JSON.stringify(data, null, 2));
}

function learnPattern(trigger, response, type = "exact") {
  const ml = loadML();
  if (!ml.patterns[type]) ml.patterns[type] = {};
  ml.patterns[type][trigger.toLowerCase()] = response;
  saveML(ml);
}

function learnResponse(intent, response) {
  const ml = loadML();
  if (!ml.responses[intent]) ml.responses[intent] = [];
  if (!ml.responses[intent].includes(response)) {
    ml.responses[intent].push(response);
  }
  saveML(ml);
}

function learnAction(action, target, success) {
  const ml = loadML();
  const key = `${action}_${target}`;
  ml.successCount[key] = (ml.successCount[key] || 0) + (success ? 1 : 0);
  ml.failedCount[key] = (ml.failedCount[key] || 0) + (success ? 0 : 1);
  ml.actionHistory.push({ action, target, success, time: Date.now() });
  if (ml.actionHistory.length > 100) ml.actionHistory = ml.actionHistory.slice(-100);
  saveML(ml);
}

function recordCorrection(original, corrected, type) {
  const ml = loadML();
  ml.corrections.push({ original, corrected, type, time: Date.now() });
  if (ml.corrections.length > 50) ml.corrections = ml.corrections.slice(-50);
  saveML(ml);
}

function getLearnedResponse(intent) {
  const ml = loadML();
  return ml.responses[intent] || null;
}

function getBestAction(action, target) {
  const ml = loadML();
  const key = `${action}_${target}`;
  const success = ml.successCount[key] || 0;
  const failed = ml.failedCount[key] || 0;
  const total = success + failed;
  if (total === 0) return null;
  return { successRate: success / total, total, success, failed };
}

function learnUserPreference(userId, preference, value) {
  const ml = loadML();
  if (!ml.userPreferences[userId]) ml.userPreferences[userId] = {};
  ml.userPreferences[userId][preference] = value;
  saveML(ml);
}

function getUserPreference(userId, preference) {
  const ml = loadML();
  return ml.userPreferences[userId]?.[preference];
}

function addLearnedFact(fact) {
  const ml = loadML();
  if (!ml.learnedFacts.includes(fact)) {
    ml.learnedFacts.push(fact);
    saveML(ml);
  }
}

function getLearnedFacts() {
  return loadML().learnedFacts;
}

function getIntelligenceScore() {
  const ml = loadML();
  const patterns = Object.keys(ml.patterns).reduce((acc, k) => acc + Object.keys(ml.patterns[k]).length, 0);
  const responses = Object.keys(ml.responses).reduce((acc, k) => acc + ml.responses[k].length, 0);
  const actions = ml.actionHistory.length;
  const corrections = ml.corrections.length;
  return {
    patterns,
    responses,
    actions,
    corrections,
    learnedFacts: ml.learnedFacts.length,
    score: patterns * 2 + responses * 3 + actions + corrections * 5 + ml.learnedFacts.length * 4
  };
}

module.exports = {
  learnPattern,
  learnResponse,
  learnAction,
  recordCorrection,
  getLearnedResponse,
  getBestAction,
  learnUserPreference,
  getUserPreference,
  addLearnedFact,
  getLearnedFacts,
  getIntelligenceScore,
  loadML
};