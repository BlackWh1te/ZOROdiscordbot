const fs = require("fs");
const path = require("path");

const autoFile = path.join(__dirname, "..", "data", "auto.json");

function ensureDataDir() {
  const dir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadAuto() {
  ensureDataDir();
  if (!fs.existsSync(autoFile)) {
    const defaultData = {
      triggers: {},
      scheduledTasks: {},
      workflows: [],
      reactionResponses: {}
    };
    fs.writeFileSync(autoFile, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  return JSON.parse(fs.readFileSync(autoFile, "utf8"));
}

function saveAuto(data) {
  ensureDataDir();
  fs.writeFileSync(autoFile, JSON.stringify(data, null, 2));
}

function addTrigger(trigger, response, options = {}) {
  const auto = loadAuto();
  auto.triggers[trigger.toLowerCase()] = { response, ...options };
  saveAuto(auto);
}

function removeTrigger(trigger) {
  const auto = loadAuto();
  delete auto.triggers[trigger.toLowerCase()];
  saveAuto(auto);
}

function getTrigger(message) {
  const auto = loadAuto();
  const triggers = Object.keys(auto.triggers);
  for (const t of triggers) {
    const trigger = auto.triggers[t];
    if (trigger.type === "exact" && message === t) return trigger;
    if (trigger.type === "contains" && message.toLowerCase().includes(t)) return trigger;
    if (trigger.type === "starts" && message.toLowerCase().startsWith(t)) return trigger;
  }
  return null;
}

function addWorkflow(name, steps) {
  const auto = loadAuto();
  auto.workflows.push({ name, steps, enabled: true });
  saveAuto(auto);
}

function runWorkflow(name, context) {
  const auto = loadAuto();
  const workflow = auto.workflows.find(w => w.name === name);
  if (!workflow || !workflow.enabled) return null;

  const results = [];
  for (const step of workflow.steps) {
    results.push({ step: step.name, result: "executed" });
  }
  return results;
}

function addScheduledTask(id, task, interval) {
  const auto = loadAuto();
  auto.scheduledTasks[id] = { task, interval, lastRun: 0 };
  saveAuto(auto);
}

function shouldRunScheduled(id, interval) {
  const auto = loadAuto();
  const task = auto.scheduledTasks[id];
  if (!task) return false;
  return Date.now() - task.lastRun > interval;
}

function markScheduledRun(id) {
  const auto = loadAuto();
  if (auto.scheduledTasks[id]) {
    auto.scheduledTasks[id].lastRun = Date.now();
    saveAuto(auto);
  }
}

function addReactionResponse(emoji, response) {
  const auto = loadAuto();
  auto.reactionResponses[emoji] = response;
  saveAuto(auto);
}

function getReactionResponse(emoji) {
  const auto = loadAuto();
  return auto.reactionResponses[emoji];
}

module.exports = {
  loadAuto,
  addTrigger,
  removeTrigger,
  getTrigger,
  addWorkflow,
  runWorkflow,
  addScheduledTask,
  shouldRunScheduled,
  markScheduledRun,
  addReactionResponse,
  getReactionResponse
};