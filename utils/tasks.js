const fs = require("fs");
const path = require("path");

const tasksFile = path.join(__dirname, "..", "storage", "tasks.json");

function ensureDir() {
  const dir = path.join(__dirname, "..", "storage");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

function loadTasks() {
  ensureDir();
  if (!fs.existsSync(tasksFile)) return [];
  return JSON.parse(fs.readFileSync(tasksFile, "utf8"));
}

function saveTasks(tasks) {
  ensureDir();
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}

function getNextTaskNumber() {
  const tasks = loadTasks();
  const maxNum = tasks.reduce((max, t) => Math.max(max, t.taskNumber || 0), 0);
  return String(maxNum + 1).padStart(3, "0");
}

function addTask(name, details, startTime = null, duration = null) {
  const tasks = loadTasks();
  const task = {
    id: Date.now(),
    taskNumber: getNextTaskNumber(),
    name,
    details: details || "",
    startTime,
    duration,
    status: "pending",
    created: Date.now()
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

function getTasks() {
  return loadTasks().filter(t => t.status !== "completed" && t.status !== "removed");
}

function getTaskByNumber(taskNumber) {
  const tasks = loadTasks();
  const num = String(taskNumber).padStart(3, "0");
  return tasks.find(t => t.taskNumber === num && t.status !== "completed" && t.status !== "removed");
}

function completeTask(idOrNumber) {
  const tasks = loadTasks();
  let idx = tasks.findIndex(t => t.id === idOrNumber);
  if (idx < 0) {
    const num = String(idOrNumber).padStart(3, "0");
    idx = tasks.findIndex(t => t.taskNumber === num);
  }
  if (idx >= 0) {
    tasks[idx].status = "completed";
    saveTasks(tasks);
    return tasks[idx];
  }
  return null;
}

function removeTask(idOrNumber) {
  const tasks = loadTasks();
  let idx = tasks.findIndex(t => t.id === idOrNumber);
  if (idx < 0) {
    const num = String(idOrNumber).padStart(3, "0");
    idx = tasks.findIndex(t => t.taskNumber === num);
  }
  if (idx >= 0) {
    const removed = tasks.splice(idx, 1)[0];
    saveTasks(tasks);
    return removed;
  }
  return null;
}

function formatTasks() {
  const tasks = getTasks();
  if (tasks.length === 0) return "📋 **Task List:**\n❌ No pending tasks!\n\n💡 Add: add task [name] - [details]";

  const now = Date.now();
  let list = "📋 **📋 TASK LIST**\n━━━━━━━━━━━━━━━━━━━━\n\n";
  let nextTask = null;
  let nextDiff = Infinity;

  tasks.forEach((t, i) => {
    let timeInfo = "";
    let status = "⏳";
    if (t.startTime) {
      const ms = t.startTime - now;
      if (ms > 0) {
        const hours = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        timeInfo = hours > 0 ? `⏰ ${hours}h ${mins}m` : `⏰ ${mins}m`;
        if (ms < nextDiff) { nextDiff = ms; nextTask = t.name; }
      } else {
        timeInfo = "▶️ NOW";
        status = "▶️";
      }
    } else {
      timeInfo = "📌 Anytime";
    }
    list += `#${t.taskNumber} ${status} **${t.name}**\n`;
    if (t.details) list += `   📝 ${t.details}\n`;
    if (timeInfo) list += `   ${timeInfo}\n`;
    list += `\n`;
  });

  list += "━━━━━━━━━━━━━━━━━━━━\n";
  list += `✅ Total: ${tasks.length} tasks\n`;
  if (nextTask) list += `📍 Next: ${nextTask}\n`;
  list += `\n💡 Actions: complete #[id] | remove #[id] | details #[id]`;
  return list;
}

module.exports = { addTask, getTasks, getTaskByNumber, completeTask, removeTask, formatTasks };