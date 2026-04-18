const fs = require("fs");
const path = require("path");

const eventsFile = path.join(__dirname, "..", "data", "events.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadEvents() {
  ensureDataDir();
  if (!fs.existsSync(eventsFile)) {
    const defaultData = {
      reactionResponses: {},
      joinMessage: null,
      leaveMessage: null,
      voiceActivity: {},
      memberStats: [],
      lastJoin: null,
      lastLeave: null
    };
    fs.writeFileSync(eventsFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(eventsFile, "utf8"));
}

function saveEvents(data) {
  ensureDataDir();
  fs.writeFileSync(eventsFile, JSON.stringify(data, null, 2));
}

function setJoinMessage(message) {
  const data = loadEvents();
  data.joinMessage = message;
  saveEvents(data);
}

function setLeaveMessage(message) {
  const data = loadEvents();
  data.leaveMessage = message;
  saveEvents(data);
}

function getJoinMessage() {
  return loadEvents().joinMessage;
}

function getLeaveMessage() {
  return loadEvents().leaveMessage;
}

function addReactionResponse(emoji, response) {
  const data = loadEvents();
  data.reactionResponses[emoji] = response;
  saveEvents(data);
}

function getReactionResponse(emoji) {
  return loadEvents().reactionResponses[emoji];
}

function recordJoin(userId, username) {
  const data = loadEvents();
  data.lastJoin = { userId, username, time: Date.now() };
  data.memberStats.push({ userId, username, joined: Date.now() });
  if (data.memberStats.length > 50) data.memberStats = data.memberStats.slice(-50);
  saveEvents(data);
}

function recordLeave(userId, username) {
  const data = loadEvents();
  data.lastLeave = { userId, username, time: Date.now() };
  saveEvents(data);
}

function getMemberStats() {
  return loadEvents().memberStats;
}

function getRecentJoins() {
  return loadEvents().memberStats.slice(-10);
}

function setVoiceActivity(channelId, message) {
  const data = loadEvents();
  data.voiceActivity[channelId] = message;
  saveEvents(data);
}

function getVoiceActivity(channelId) {
  return loadEvents().voiceActivity[channelId];
}

module.exports = {
  loadEvents,
  setJoinMessage,
  setLeaveMessage,
  getJoinMessage,
  getLeaveMessage,
  addReactionResponse,
  getReactionResponse,
  recordJoin,
  recordLeave,
  getMemberStats,
  getRecentJoins,
  setVoiceActivity,
  getVoiceActivity
};