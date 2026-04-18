const tasks = new Map();
const messages = new Map();
const storage = require("./storage");
const path = require("path");
let tasksModule = null;
let fetcherModule = null;

function setTasksModule(tasksRef) {
  tasksModule = tasksRef;
}

function setFetcherModule(fetcherRef) {
  fetcherModule = fetcherRef;
}

function loadFromStorage() {
  const storedTasks = storage.getTasks();
  let loaded = 0;
  const now = Date.now();
  for (const task of storedTasks) {
    if (task.type === "scheduled") {
      const isDynamic = task.contentType === "dynamic" || (task.message && task.message.toUpperCase().includes("TASK LIST"));
      const isWeb = task.contentType === "web";
      messages.set(task.name, {
        channelId: task.channel,
        message: task.message || "",
        contentType: isWeb ? "web" : (isDynamic ? "dynamic" : "static"),
        searchType: task.searchType || null,
        interval: task.interval,
        lastRun: now - task.interval - 1000,
        enabled: true,
        name: task.name
      });
      loaded++;
    }
  }
  console.log(`📥 Loaded ${loaded} scheduled tasks from storage`);
  return loaded;
}

function addScheduledMessage(channelId, message, intervalMs, name, contentType = "static") {
  const taskData = {
    name: name || "task_" + Date.now(),
    channelId,
    message,
    contentType,
    interval: intervalMs,
    lastRun: 0,
    enabled: true,
    created: Date.now()
  };
  messages.set(taskData.name, taskData);
  storage.addTask({
    name: taskData.name,
    type: "scheduled",
    message: message,
    contentType: contentType,
    channel: channelId,
    interval: intervalMs
  });
  storage.saveEverything({ lastTaskCreated: Date.now() });
  console.log("✅ Task saved to storage:", taskData.name);
}

function addWebScheduledMessage(channelId, searchQuery, searchType, intervalMs, name) {
  const taskData = {
    name: name || "web_" + Date.now(),
    channelId,
    message: searchQuery,
    contentType: "web",
    searchType: searchType,
    interval: intervalMs,
    lastRun: 0,
    enabled: true,
    created: Date.now()
  };
  messages.set(taskData.name, taskData);
  storage.addTask({
    name: taskData.name,
    type: "scheduled",
    message: searchQuery,
    contentType: "web",
    searchType: searchType,
    channel: channelId,
    interval: intervalMs
  });
  storage.saveEverything({ lastTaskCreated: Date.now() });
  console.log("✅ Web task saved:", taskData.name, searchQuery);
}

function removeScheduled(name) {
  const task = messages.get(name);
  if (task) {
    storage.removeTask(name);
    messages.delete(name);
  }
}

function getScheduled() {
  return Array.from(messages.entries()).map(([name, m]) => ({
    name,
    channel: m.channelId,
    message: m.message,
    interval: m.interval,
    enabled: m.enabled
  }));
}

function setEnabled(name, enabled) {
  if (messages.has(name)) {
    messages.get(name).enabled = enabled;
  }
}

async function checkScheduledMessages(client) {
  const now = Date.now();
  for (const [name, task] of messages) {
    if (!task.enabled) continue;
    if (now - task.lastRun >= task.interval) {
      try {
        const channel = await client.channels.fetch(task.channelId);
        if (channel) {
          let content = task.message;
          
          if (task.contentType === "web") {
            if (!fetcherModule) {
              fetcherModule = require(path.join(__dirname, "fetcher"));
            }
            if (task.searchType === "cs2" || task.message.toLowerCase().includes("cs2")) {
              const news = await fetcherModule.fetchCS2News();
              content = fetcherModule.formatNewsMessage(news);
            } else {
              content = "Web search: " + task.message;
            }
          } else if (task.contentType === "dynamic" || content.toUpperCase().includes("TASK LIST")) {
            if (!tasksModule) {
              tasksModule = require(path.join(__dirname, "tasks"));
            }
            content = tasksModule.formatTasks();
          }
          
          await channel.send(content);
          task.lastRun = now;
          console.log("✅ Sent scheduled:", task.name);
        }
      } catch (e) {
        console.error("Scheduled message error:", e);
      }
    }
  }
}

function startScheduler(client, checkInterval = 60000) {
  loadFromStorage();
  setInterval(() => checkScheduledMessages(client), checkInterval);
  console.log("✅ Scheduler ready with persistent tasks");
}

module.exports = { addScheduledMessage, removeScheduled, getScheduled, setEnabled, checkScheduledMessages, startScheduler, setTasksModule };