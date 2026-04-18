const fs = require("fs");
const path = require("path");

const storageDir = path.join(__dirname, "..", "storage");
const stateFile = path.join(storageDir, "state.json");
const checkpointFile = path.join(storageDir, "checkpoint.json");
const dataFile = path.join(storageDir, "data.json");

function ensureDir() {
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
    console.log("📁 Created storage directory");
  }
}

function loadState() {
  ensureDir();
  if (!fs.existsSync(stateFile)) {
    return { started: Date.now(), version: "1.0", tasks: [], checkpoints: [] };
  }
  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function saveState(state) {
  ensureDir();
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function addTask(task) {
  const state = loadState();
  state.tasks.push({ ...task, id: Date.now(), created: Date.now() });
  saveState(state);
  console.log("✅ Task added:", task.name);
}

function getTasks() {
  return loadState().tasks;
}

function removeTask(id) {
  const state = loadState();
  if (typeof id === "number") {
    state.tasks = state.tasks.filter(t => t.id !== id);
  } else {
    state.tasks = state.tasks.filter(t => t.name !== id);
  }
  saveState(state);
  console.log("✅ Task removed:", id);
}

function createCheckpoint(name, data = {}) {
  const state = loadState();
  const checkpoint = {
    id: Date.now(),
    name,
    data,
    time: new Date().toISOString(),
    activeTasks: state.tasks.length
  };
  state.checkpoints.push(checkpoint);
  if (state.checkpoints.length > 10) state.checkpoints = state.checkpoints.slice(-10);
  saveState(state);
  console.log("💾 Checkpoint created:", name);
  return checkpoint;
}

function loadCheckpoint(name) {
  const state = loadState();
  return state.checkpoints.find(c => c.name === name);
}

function getLatestCheckpoint() {
  const state = loadState();
  return state.checkpoints[state.checkpoints.length - 1];
}

function setData(key, value) {
  ensureDir();
  let data = {};
  if (fs.existsSync(dataFile)) {
    data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  }
  data[key] = value;
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function getData(key) {
  ensureDir();
  if (!fs.existsSync(dataFile)) return null;
  const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  return data[key];
}

function saveEverything(state = {}) {
  ensureDir();
  saveState({ ...loadState(), ...state, lastSave: Date.now() });
  console.log("💾 All state saved");
}

module.exports = {
  ensureDir, loadState, saveState, addTask, getTasks, removeTask,
  createCheckpoint, loadCheckpoint, getLatestCheckpoint,
  setData, getData, saveEverything
};