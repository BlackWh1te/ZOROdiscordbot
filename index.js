require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  ActivityType,
  Events,
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const ollama = require("./utils/ollama");
const memory = require("./utils/memory");
const knowledge = require("./utils/knowledge");
const intelligence = require("./utils/intelligence");
const ml = require("./utils/ml");
const DiscordBrain = require("./utils/brain");
const scheduler = require("./utils/scheduler");
const events = require("./utils/events");
const monitor = require("./utils/monitor");
const storage = require("./utils/storage");
const tasks = require("./utils/tasks");
const github = require("./utils/github");
const { isOwner } = require("./utils/permissions");
const PUBLIC_MODE = process.env.PUBLIC_MODE === "true";
const ADMIN_CHANNEL = process.env.ADMIN_CHANNEL;
const OWNER_DM_CHANNEL = process.env.OWNER_DM_CHANNEL;
const CHAT_CHANNEL = process.env.CHAT_CHANNEL;
const welcome = require("./utils/welcome");
const xp = require("./utils/xp");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message],
});

let brain;

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
let commandCount = 0;
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".js"));
  for (const file of commandFiles) {
    try {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
        commandCount++;
        console.log(`Loaded command: ${cmd.data.name}`);
      }
    } catch (e) {
      console.error(`Error loading ${file}:`, e.message);
    }
  }
}
console.log(`Total commands loaded: ${commandCount}`);

const PREFIX = process.env.BOT_PREFIX || "!ai";
const ADMIN_PREFIX = "!admin";

client.once(Events.ClientReady, async () => {
  storage.ensureDir();
  storage.createCheckpoint("startup", { time: Date.now(), event: "bot_started" });
  const loadedTasks = scheduler.getScheduled();
  console.log(`📋 Resuming ${loadedTasks.length} persistent tasks`);
  brain = new DiscordBrain(client, ollama, knowledge, ml);
  console.log(`\n  DSbot Online — ${client.user.tag}`);
  console.log(`  Servers: ${client.guilds.cache.size}`);
  console.log(`  Prefix: ${PREFIX}`);

  const running = await ollama.isRunning();
  if (running) {
    const models = await ollama.listModels();
    const modelNames = models.map((m) => m.name).join(", ");
    console.log(`  Ollama: CONNECTED — Models: ${modelNames || "none"}`);
    client.user.setActivity(`Ollama | ${ollama.getModel()}`, {
      type: ActivityType.Watching,
    });

    for (const guild of client.guilds.cache.values()) {
      console.log(`  Scanning server: ${guild.name}`);
      const serverInfo = await brain.analyzeServer(guild);
      console.log(`    - ${serverInfo.channels} channels, ${serverInfo.roles} roles, ${serverInfo.members} members`);
    }
  } else {
    console.log("  Ollama: NOT DETECTED — Start Ollama to enable AI features");
    client.user.setActivity("Ollama offline", { type: ActivityType.Watching });
  }

  console.log("  Chat Channel:", CHAT_CHANNEL);
  storage.setData("chatChannel", CHAT_CHANNEL);
  scheduler.setTasksModule(tasks);
  scheduler.startScheduler(client, 60000);
  monitor.startMonitorLoop(client, ollama, 60000);
  console.log("  Scheduler: Running");
  console.log("  Monitor: Running");
  console.log("");
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (!isOwner(interaction.user.id) && !PUBLIC_MODE) {
    return interaction.reply({
      content: "Only the bot owner can use this command.",
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction, { ollama, memory, client });
  } catch (error) {
    console.error("Command error:", error);
    const reply = {
      content: "Error executing command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (isOwner(message.author.id)) {
    const lowerMsg = message.content.toLowerCase();
    if (lowerMsg.includes("moderate") || lowerMsg.includes("filter") || lowerMsg.includes("bad words") || lowerMsg.includes("spam protection") || lowerMsg.includes("mute")) {
      intelligence.updateConfig("autoModerate", true);
      await message.reply("✅ Auto-moderation enabled! I'll auto-mute users who use bad words or spam. After 3 warns = temp ban.");
      return;
    }
    if (lowerMsg.includes("stop moderate") || lowerMsg.includes("disable moderation")) {
      intelligence.updateConfig("autoModerate", false);
      await message.reply("✅ Auto-moderation disabled.");
      return;
    }
  }

  const autoMod = intelligence.loadConfig().autoModerate;
  if (autoMod && message.guild) {
    const badWords = ["spam", "scam", "fuck", "shit", "bitch", "ass", "damn", "nigga", "nigger", "faggot", "retard"];
    const msgLower = message.content.toLowerCase();
    const hasBad = badWords.some(w => msgLower.includes(w));
    const isSpam = msgLower.length > 200 || (message.mentions.users.size > 3);

    if (hasBad || isSpam) {
      const member = message.member;
      if (member) {
        await message.delete();
        await message.author.send("⚠️ Your message was removed for containing inappropriate content. Please follow server rules!");
        ml.learnAction("moderate", message.author.id, true);
        return;
      }
    }
  }

  const mentioned = message.mentions.has(client.user);
  const startsWithPrefix = message.content.startsWith(PREFIX);
  const startsWithAdmin = message.content.startsWith(ADMIN_PREFIX);
  const inAdminChannel = ADMIN_CHANNEL && message.channel.id === ADMIN_CHANNEL;
  const inChatChannel = CHAT_CHANNEL && (message.channel.id === CHAT_CHANNEL || message.channel.id === process.env.CHAT_CHANNEL);
  const isDM = message.channel.type === 1;
  const isOwnerDirect = isOwner(message.author.id);

if (inChatChannel && !isOwnerDirect) {
      console.log("Chat msg:", message.author.username, "| content:", message.content.substring(0, 30));
      const running = await ollama.isRunning();
      if (!running) {
        await message.reply("Ollama not running!");
        return;
      }

      const userMessage = message.content;
      if (!userMessage || userMessage.trim() === "") {
        return;
      }

      // Check for GitHub selection first
      const pendingSelection = github.getPending(message.author.id);
      if (pendingSelection && userMessage.match(/^#?\d+\s*\S*/)) {
        const selectedNum = parseInt(userMessage.replace("#", "").trim().split(/\s/)[0]);
        console.log("Selected:", selectedNum, "| pending:", pendingSelection ? "yes" : "no");
        const selectedRepo = pendingSelection.repos.find(r => r.index === selectedNum);
        
        if (!selectedRepo) {
          await message.reply("❌ Invalid selection. Use #1, #2, etc.");
          return;
        }
        
        await message.reply("📥 Fetching " + selectedRepo.name + "...");
        github.clearPending(message.author.id);
        
        try {
          const readme = await github.fetchReadme(selectedRepo.url, ollama);
          const release = await github.checkRelease(selectedRepo.url);
          
          const analysisMsg = github.formatAnalysis(readme, release);
          await message.reply(analysisMsg);
          
          const targetChannel = message.guild.channels.cache.find(c => c.name.toLowerCase() === "src") || message.channel;
          await targetChannel.send("📦 **" + selectedRepo.name + "**\n" + analysisMsg);
          await message.reply("✅ Posted to #" + targetChannel.name);
        } catch (e) {
          console.error("Fetch error:", e);
          await message.reply("❌ Failed to fetch repo data.");
        }
        return;
      }

      try {
        const history = memory.getHistory(`chat_${message.channel.id}`);
        const guild = message.guild || { name: "Chat" };
        // Base system prompt for channel chat
        const systemPrompt = "You are zoroBOT, a friendly AI assistant. Keep responses short and friendly. Only chat - don't execute commands.";
        // Enhance system prompt with learned facts to improve long-term context in channel conversations
        const learnedFacts = ml.getLearnedFacts();
        const systemPromptWithLearned = learnedFacts && learnedFacts.length > 0
          ? systemPrompt + "\n\nLearned facts: " + learnedFacts.join(", ")
          : systemPrompt;
        const messages = [
          { role: "system", content: systemPrompt },
          ...history.slice(-10),
          { role: "user", content: userMessage },
        ];

        await message.channel.sendTyping();
        const response = await ollama.chat(messages);
        console.log("Response:", response.substring(0, 50));
        memory.addMessage(`chat_${message.channel.id}`, "user", userMessage);
        memory.addMessage(`chat_${message.channel.id}`, "assistant", response);

        if (response && response.length > 0) {
          await message.reply(response);
        }
      } catch (e) {
        console.error("Chat error:", e);
        await message.reply("Error: " + e.message);
      }
      return;
    }

  if (isDM || (inAdminChannel && isOwnerDirect) || inChatChannel) {
    const running = await ollama.isRunning();
    if (!running) {
      await message.reply("Ollama not running!");
      return;
    }

    const userMessage = message.content;
    const lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.startsWith("remember:") || lowerMsg.startsWith("learn:")) {
      const fact = userMessage.replace(/^(remember|learn):\s*/i, "").trim();
      ml.addLearnedFact(fact);
      await message.reply("Got it! I've learned: " + fact);
      return;
    }

    if (lowerMsg.startsWith("forget:") || lowerMsg.startsWith("ignore:")) {
      await message.reply("I'll ignore that. Is there something specific you'd like me to not do?");
      return;
    }

    if (lowerMsg.includes("thanks") || lowerMsg.includes("thank you") || lowerMsg.includes("good bot")) {
      await message.reply("You're welcome! Happy to help! Let me know if you need anything else.");
      return;
    }

    if (lowerMsg.includes("what do you know") || lowerMsg.includes("what have you learned") || lowerMsg === "learned") {
      const learned = ml.getLearnedFacts();
      const intel = ml.getIntelligenceScore();
      const list = learned.length > 0 ? learned.join("\n") : "Nothing yet! Use 'learn: something' to teach me.";
      await message.reply("I've learned:\n" + list + "\n\n📊 Intelligence Score: " + intel.score);
      return;
    }

    if (lowerMsg.includes("my server") || lowerMsg.includes("server info")) {
      const guild = message.guild;
      if (guild && brain) {
        const info = await brain.analyzeServer(guild);
        await message.reply("📋 **" + info.name + "**\n👥 Members: " + info.members + "\n📝 Channels: " + info.channels + "\n🎭 Roles: " + info.roles);
        return;
      }
    }

    if (lowerMsg.includes("help me") || lowerMsg.includes("what can you do") || lowerMsg === "help") {
      await message.reply("I can:\n- Create/delete channels & roles\n- Kick/ban members\n- Answer questions\n- Learn facts\n- Manage your server\n\nJust ask naturally!");
      return;
    }

    if (lowerMsg.includes("summarize") || lowerMsg.includes("summary")) {
      const hist = memory.getHistory(`dm_${message.author.id}`);
      const last5 = hist.slice(-5).map(m => m.role + ": " + m.content.substring(0, 50)).join("\n");
      await message.reply("📝 Recent conversation:\n" + (last5 || "No history"));
      return;
    }

    if (lowerMsg.includes("clear memory") || lowerMsg.includes("forget everything")) {
      memory.clearHistory(`dm_${message.author.id}`);
      await message.reply("Done! I've cleared our conversation history.");
      return;
    }

    if (lowerMsg === "hi" || lowerMsg === "hello" || lowerMsg === "hey") {
      const greetings = ["Hey!", "Hi there!", "Hello!", "Yo!", "Hey hey!"];
      const greet = greetings[Math.floor(Math.random() * greetings.length)];
      const guild = message.guild;
      await message.reply(greet + " 👋 " + (guild ? "Welcome to **" + guild.name + "**!" : "How can I help?"));
      return;
    }

    if (lowerMsg.startsWith("new task send") || lowerMsg.startsWith("schedule task") || (lowerMsg.includes("new task") && lowerMsg.includes("every"))) {
      // Let this fall through to the scheduler handler below
    } else if (lowerMsg.includes("task list") || lowerMsg === "tasks") {
      await message.reply(tasks.formatTasks());
      return;
    }

    const taskIdMatch = userMessage.match(/#(\d+)/);
    if (taskIdMatch) {
      const taskId = taskIdMatch[1];
      if (lowerMsg.includes("complete") || lowerMsg.includes("done")) {
        const task = tasks.completeTask(taskId);
        if (task) {
          await message.reply("✅ Completed: #" + task.taskNumber + " " + task.name);
        } else {
          await message.reply("❌ Task #" + taskId + " not found");
        }
        return;
      }
      if (lowerMsg.includes("remove") || lowerMsg.includes("delete") || lowerMsg.includes("del")) {
        const task = tasks.removeTask(taskId);
        if (task) {
          await message.reply("✅ Removed: #" + task.taskNumber + " " + task.name);
        } else {
          await message.reply("❌ Task #" + taskId + " not found");
        }
        return;
      }
      if (lowerMsg.includes("details") || lowerMsg.includes("info")) {
        const task = tasks.getTaskByNumber(taskId);
        if (task) {
          const ms = task.startTime ? task.startTime - Date.now() : null;
          const left = ms && ms > 0 ? Math.floor(ms/60000) + " min" : "Now";
          await message.reply(`📋 **#${task.taskNumber} ${task.name}**\n📝 ${task.details || "No details"}\n⏰ ${task.startTime ? new Date(task.startTime).toLocaleString() : "Anytime"}\n⏳ ${left}`);
        } else {
          await message.reply("❌ Task #" + taskId + " not found");
        }
        return;
      }
    }

    if (lowerMsg.startsWith("complete ") || lowerMsg.startsWith("done ")) {
      const num = userMessage.match(/\d+/)?.[0];
      if (num) {
        const task = tasks.completeTask(num);
        if (task) {
          await message.reply("✅ Completed: #" + task.taskNumber + " " + task.name);
        } else {
          await message.reply("❌ Task not found");
        }
        return;
      }
    }

    if (lowerMsg.startsWith("remove ") || lowerMsg.startsWith("delete ")) {
      const num = userMessage.match(/\d+/)?.[0];
      if (num) {
        const task = tasks.removeTask(num);
        if (task) {
          await message.reply("✅ Removed: #" + task.taskNumber + " " + task.name);
        } else {
          await message.reply("❌ Task not found");
        }
        return;
      }
    }

    if (lowerMsg.startsWith("details ") || lowerMsg.startsWith("info ")) {
      const num = userMessage.match(/\d+/)?.[0];
      if (num) {
        const task = tasks.getTaskByNumber(num);
        if (task) {
          const ms = task.startTime ? task.startTime - Date.now() : null;
          const left = ms && ms > 0 ? Math.floor(ms/60000) + " min" : "Now";
          await message.reply(`📋 **#${task.taskNumber} ${task.name}**\n📝 ${task.details || "No details"}\n⏰ ${task.startTime ? new Date(task.startTime).toLocaleString() : "Anytime"}\n⏳ ${left}`);
        } else {
          await message.reply("❌ Task not found");
        }
        return;
      }
    }

    if (lowerMsg.includes("hours left") || lowerMsg.includes("time left") || lowerMsg.includes("remaining")) {
      const all = tasks.getTasks();
      if (all.length > 0) {
        let reply = "⏰ **Time Remaining:**\n";
        all.forEach((t, i) => {
          if (t.startTime) {
            const ms = t.startTime - Date.now();
            if (ms > 0) {
              const h = Math.floor(ms/3600000);
              const m = Math.floor((ms%3600000)/60000);
              reply += `${i+1}. ${t.name}: ${h}h ${m}m\n`;
            }
          }
        });
        await message.reply(reply);
        return;
      }
    }

if (lowerMsg.startsWith("new task send") || lowerMsg.startsWith("schedule task")) {
      
    } else if ((lowerMsg.startsWith("new task:") || lowerMsg.startsWith("task:")) && !lowerMsg.includes("every") && !lowerMsg.includes("send")) {
      const taskName = userMessage.replace(/^(new task: |task: )/i, "").split(" - ")[0].trim();
      const taskDetails = userMessage.split(" - ")[1]?.trim() || "";
      tasks.addTask(taskName, taskDetails);
      await message.reply("✅ Task added: " + taskName + "\n💡 Say 'task list' to see all!");
      return;
    } else if ((lowerMsg.startsWith("add task ")) && !lowerMsg.includes("every") && !lowerMsg.includes("send")) {
      const taskName = userMessage.replace(/^(add task )/i, "").split(" - ")[0].trim();
      const taskDetails = userMessage.split(" - ")[1]?.trim() || "";
      tasks.addTask(taskName, taskDetails);
      await message.reply("✅ Task added: " + taskName + "\n💡 Say 'task list' to see all!");
      return;
    }

    if (lowerMsg.startsWith("add task ") && !lowerMsg.includes("every") && !lowerMsg.includes("send")) {
      const taskName = userMessage.replace(/^(add task )/i, "").split(" - ")[0].trim();
      const taskDetails = userMessage.split(" - ")[1]?.trim() || "";
      tasks.addTask(taskName, taskDetails);
      await message.reply("✅ Task added: " + taskName + "\n💡 Say 'task list' to see all!");
      return;
    }

    if (lowerMsg.includes("who am i") || lowerMsg.includes("my info") || lowerMsg === "who are you") {
      await message.reply("I'm zoroBOT - your AI assistant! 🤖 You're the server owner, so you have full control.");
      return;
    }

    if (lowerMsg.includes("status")) {
      const running = await ollama.isRunning();
      const model = ollama.getModel();
      const mem = memory.getHistory(`dm_${message.author.id}`).length;
      await message.reply("📊 Status:\n- Ollama: " + (running ? "✅ Online" : "❌ Offline") + "\n- Model: " + model + "\n- Chat history: " + mem + " messages");
      return;
    }

    if (lowerMsg === "ok" || lowerMsg === "okay" || lowerMsg === "sure") {
      await message.reply("👍 Got it!");
      return;
    }

    if (lowerMsg === "lol" || lowerMsg === "lmao" || lowerMsg.includes("haha") || lowerMsg.includes("😂")) {
      const laughs = ["😄", "😂", "😅", "🤣"];
      await message.reply(laughs[Math.floor(Math.random() * laughs.length)]);
      return;
    }

    if (lowerMsg.includes("cool") || lowerMsg.includes("nice")) {
      await message.reply("😎");
      return;
    }

    if (lowerMsg.includes("sorry") || lowerMsg.includes("oops")) {
      await message.reply("No worries! 👍");
      return;
    }

    if (lowerMsg === "?" || lowerMsg === "what?") {
      await message.reply("What do you need? Just ask!");
      return;
    }

    if (lowerMsg.startsWith("suggest:")) {
      await message.reply("💡 Suggestions:\n- Create a new channel\n- Show server stats\n- Learn something new\n- Check who joined\nJust ask me anything!");
      return;
    }

    if (lowerMsg.startsWith("every") || lowerMsg.includes("schedule") || lowerMsg.includes("repeat")) {
      const parts = userMessage.match(/(?:every|schedule|repeat)\s+(?:hour|minute|day)?\s*(\d+)?\s*(hour|minute|day)?\s+(?:send|post)?\s+(.+)/i);
      if (parts || lowerMsg.includes("send") || lowerMsg.includes("post") || lowerMsg.includes("every")) {
        const channel = message.mentions.channels.first() || message.channel;
        if (parts || lowerMsg.includes("hello")) {
          const intervalMap = { minute: 60000, hour: 3600000, day: 86400000 };
          let interval = 3600000;
          let content = "Hello";

          if (lowerMsg.includes("hour")) interval = 3600000;
          else if (lowerMsg.includes("minute")) interval = 60000;
          else if (lowerMsg.includes("day")) interval = 86400000;

          const match = userMessage.match(/(\d+)\s*(hour|minute|day)/i);
          if (match) {
            const num = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            interval = (unit === "hour" ? 3600000 : unit === "minute" ? 60000 : 86400000) * num;
          }

          const contentMatch = userMessage.match(/(?:send|post|message)\s+(.+)/i);
          if (contentMatch) content = contentMatch[1];
          else if (lowerMsg.includes("hello")) content = "Hello";

          const name = "sched_" + Date.now();
          scheduler.addScheduledMessage(channel.id, content, interval, name);
          await message.reply("✅ Done! I'll send '" + content + "' in #" + channel.name + " every " + (interval / 60000) + " minutes.");
          return;
        }
      }
    }

    if (isOwnerDirect && (lowerMsg === "scheduled tasks" || lowerMsg.includes("schedule list"))) {
      const scheduled = scheduler.getScheduled();
      if (scheduled.length === 0) {
        await message.reply("No scheduled tasks. Say 'new task send [message] every [number] [minute/hour]' to create one.");
        return;
      }
      let list = "📋 Your scheduled tasks:\n";
      for (const t of scheduled) {
        const mins = Math.round(t.interval / 60000);
        list += "- " + t.message.substring(0, 30) + "... every " + mins + "min\n";
      }
      await message.reply(list);
      return;
    }

    if (isOwnerDirect && lowerMsg.includes("send task list")) {
      const scheduled = scheduler.getScheduled();
      const targetCh = message.guild.channels.cache.find(c => c.name.toLowerCase().includes("zoro"));
      if (targetCh) {
        await targetCh.send("📋 **Scheduled Tasks:**\n" + (scheduled.length > 0 ? scheduled.map((t,i) => (i+1)+". "+t.message+" every "+Math.round(t.interval/60000)+"min").join("\n") : "No tasks!"));
        await message.reply("✅ Sent to #" + targetCh.name);
      }
      return;
    }

    if ((lowerMsg.includes("scheduled") || lowerMsg.includes("tasks") || lowerMsg.includes("my tasks")) && (lowerMsg.includes("give") || lowerMsg.includes("list") || lowerMsg.includes("see") || lowerMsg.includes("send"))) {
      if (isOwnerDirect || isAdminChannel) {
        const scheduled = scheduler.getScheduled();
        let list = "Your tasks:\n";
        for (const t of scheduled) {
          const mins = Math.round(t.interval / 60000);
          list += "- " + t.message + " (every " + mins + "min)\n";
        }
        await message.reply(list || "No tasks yet!");
      }
      return;
    }

    if (lowerMsg.includes("stop") && lowerMsg.includes("sched")) {
      scheduler.removeScheduled(lowerMsg.replace(/.*stop\s*sched.*/i, "").trim());
      await message.reply("Stopped scheduled messages.");
      return;
    }

    if (lowerMsg.startsWith("send ") || lowerMsg.startsWith("post ") || userMessage.toLowerCase().includes(" to ") || lowerMsg.startsWith("dm ")) {
      const content = userMessage;
      let targetChannel = null;
      let msgContent = "";

      const mentionMatch = content.match(/<#(\d+)>/);
      if (mentionMatch) {
        targetChannel = message.guild?.channels.cache.get(mentionMatch[1]);
        msgContent = content.replace(/.*<#\d+>\s*/i, "").trim();
      } else {
        const toMatch = content.match(/(?:send|post|message)\s+.*?\s+to\s+(\S+)\s+(.+)/i);
        if (toMatch) {
          const chanName = toMatch[1].replace(/^#/, "").replace(/[^a-z0-9-]/g, "");
          msgContent = toMatch[2];
          if (message.guild) {
            targetChannel = message.guild.channels.cache.find(c => c.name.toLowerCase().includes(chanName.toLowerCase()));
          }
        }
      }

      if (!targetChannel && message.mentions.channels.size > 0) {
        targetChannel = message.mentions.channels.first();
        msgContent = content.replace(/<#\d+>\s*/i, "").trim();
      }

      if (targetChannel && msgContent) {
        await targetChannel.send(msgContent);
        await message.reply("✅ Sent to #" + targetChannel.name + ": " + msgContent);
        return;
      }

      if (!targetChannel) {
        const simpleMsg = content.replace(/^(send|post|message)\s+/i, "").trim();
        if (simpleMsg && simpleMsg.length < 50) {
          await message.channel.send(simpleMsg);
          await message.reply("✅ Sent: " + simpleMsg);
          return;
        }
      }
    }

    if ((lowerMsg.includes("search") || lowerMsg.includes("find") || lowerMsg.includes("look for")) && (lowerMsg.includes("github") || lowerMsg.includes("repo") || lowerMsg.includes("repository"))) {
      const query = userMessage
        .replace(/^(search|find|look for)\s+(on\s+)?github\s+/i, "")
        .replace(/repo(sitory)?/i, "")
        .trim();
      
      if (!query) {
        await message.reply("Usage: search github [query]\nExample: search github cloud code");
        return;
      }
      
      await message.reply("🔍 Searching GitHub for: " + query + "...");
      
      try {
        const repos = await github.searchRepos(query, 10);
        if (repos.length === 0) {
          await message.reply("❌ No results found for: " + query);
          return;
        }
        
        const resultsMsg = github.formatSearchResults(repos);
        await message.reply(resultsMsg);
        
        github.setPending(message.author.id, {
          repos,
          query,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error("GitHub search error:", e);
        await message.reply("❌ Search failed. Try again.");
      }
      return;
    }

    if ((lowerMsg.includes("monetor") || lowerMsg.includes("monitor") || lowerMsg.includes("watch")) && (lowerMsg.includes("channel") || lowerMsg.includes("here")) && message.guild) {
      let channel = message.mentions.channels.first();
      if (!channel) {
        const channelName = userMessage.match(/#?([\w-]+)/)?.[1];
        if (channelName) {
          channel = message.guild.channels.cache.find(c => c.name.toLowerCase().includes(channelName.toLowerCase()));
        }
      }
      if (!channel && lowerMsg.includes("here")) {
        channel = message.channel;
      }
      if (!channel) channel = message.channel;

      let interval = 1800000;
      const intervalMatch = userMessage.match(/every\s+(\d+)\s*(minute|min|hour|day)/i);
      if (intervalMatch) {
        const num = parseInt(intervalMatch[1]);
        const unit = intervalMatch[2].toLowerCase();
        interval = (unit.startsWith("min") ? 60000 : unit.startsWith("hour") ? 3600000 : 86400000) * num;
      }

      monitor.addMonitor(channel.id, {
        analyze: true,
        interval: interval
      });

      tasks.addTask("Monitor " + channel.name, "Monitor #" + channel.name + " every " + (interval/60000) + " min", null, null);
      
      await message.reply("✅ Monitor set! I'll check #" + channel.name + " every " + (interval/60000) + " min\n✅ Also added to task list!");
      return;
    }

    if ((lowerMsg.startsWith("every ") || lowerMsg.startsWith("new task send") || lowerMsg.startsWith("schedule task")) && message.guild) {
      const msgContainsTask = lowerMsg.includes("task") || lowerMsg.includes("list");
      if (lowerMsg.includes("send") || msgContainsTask) {
        if (!brain || !ollama) {
          await message.reply("AI not available. Try again later.");
          return;
        }
        await message.reply("🤔 Thinking...");
        
        const parsed = await brain.parseRequest(userMessage);
        
        if (!parsed || parsed.action === "unknown" || parsed.confidence < 50) {
          await message.reply("❌ Could not understand. Try: 'new task send here every 15 minute task list'");
          return;
        }

        if (parsed.confidence < 70 && parsed.clarification_needed) {
          await message.reply(parsed.clarification_needed);
          return;
        }

        let channel = message.mentions.channels.first();
        if (!channel && parsed.target_channel) {
          channel = message.guild.channels.cache.find(c => c.name.toLowerCase().includes(parsed.target_channel.toLowerCase()));
        }
        if (!channel && (parsed.target_channel_type === "here" || lowerMsg.includes("here"))) {
          channel = message.channel;
        }
        if (!channel) channel = message.channel;

        let interval = 3600000;
        if (parsed.interval_unit === "minute" && parsed.interval_num) {
          interval = 60000 * parsed.interval_num;
        } else if (parsed.interval_unit === "hour" && parsed.interval_num) {
          interval = 3600000 * parsed.interval_num;
        } else if (parsed.interval_unit === "day" && parsed.interval_num) {
          interval = 86400000 * parsed.interval_num;
        }

        const originalHasTaskList = lowerMsg.includes("task list") || lowerMsg.includes("task list");
        const contentHasTaskList = parsed.content?.toLowerCase().includes("task") || parsed.content?.toLowerCase().includes("list");
        
        let isTaskList = (parsed.action === "schedule" && contentHasTaskList) || originalHasTaskList;
        
        const taskDetails = "Check and send " + (parsed.content || "task list") + " every " + (parsed.interval_num || interval/60000) + " " + (parsed.interval_unit || "minute(s)");
        
        if (isTaskList) {
          const taskName = parsed.task_name || parsed.content || "Task List Reminder";
          tasks.addTask(taskName, taskDetails, null, null);
        }

        const name = "sched_" + Date.now();
        const fallbackMsg = isTaskList ? "" : (parsed.content || "Hello");
        scheduler.addScheduledMessage(channel.id, fallbackMsg, interval, name, isTaskList ? "dynamic" : "static");
        const addedTask = isTaskList ? "\n✅ Added to task list!" : "";
        await message.reply("✅ Scheduled! Every " + (interval / 60000) + " min: '" + (parsed.content || "message").substring(0,30) + "...' in #" + channel.name + addedTask);
        return;
      }
    }

    if (lowerMsg.includes("stop monitor") || lowerMsg.includes("remove monitor")) {
      const monitors = monitor.getMonitors();
      if (monitors.length > 0) {
        monitor.removeMonitor(monitors[0].id);
        await message.reply("✅ Monitor stopped.");
      } else {
        await message.reply("No active monitors.");
      }
      return;
    }

    if (lowerMsg.startsWith("join message:") || lowerMsg.includes("welcome message")) {
      const msg = userMessage.replace(/^(join message:|welcome message:)\s*/i, "").trim();
      events.setJoinMessage(msg);
      await message.reply("✅ Join message set: " + msg);
      return;
    }

    if (lowerMsg.startsWith("leave message:") || lowerMsg.includes("bye message")) {
      const msg = userMessage.replace(/^(leave message:|bye message:)\s*/i, "").trim();
      events.setLeaveMessage(msg);
      await message.reply("✅ Leave message set: " + msg);
      return;
    }

    if (lowerMsg.includes("new members") || lowerMsg.includes("who joined")) {
      const recent = events.getRecentJoins();
      if (recent.length > 0) {
        const list = recent.map(m => m.username + " - " + new Date(m.joined).toLocaleString()).join("\n");
        await message.reply("📋 Recent joins:\n" + list);
      } else {
        await message.reply("No recent joins.");
      }
      return;
    }

    try {
      if (brain) {
        await message.channel.sendTyping();
        const result = await brain.think(message.guild || message.author, userMessage, { isOwner: true, isDM });

        if (result.action && result.action !== "none" && result.action !== "answer") {
          await message.channel.sendTyping();
          const actionResult = await brain.executeAction(
            message.guild,
            result.action,
            result.target,
            result.targetName,
            result.details || {},
            message
          );

          if (result.action === "cannot" || result.action === "none") {
            await message.reply(actionResult);
          } else {
            await message.reply(actionResult + " Done!");
            ml.learnAction(result.action, result.target, true);
          }
          return;
        }
        await message.reply(result.response || "I understand.");
        return;
      }

      const history = memory.getHistory(`dm_${message.author.id}`);
      const guild = message.guild || { name: "Direct Message" };
      const systemPrompt = knowledge.getSystemPrompt(guild);
      const learned = ml.getLearnedFacts();
      const fullPrompt = learned.length > 0 ? systemPrompt + "\n\nThings I've learned: " + learned.join(", ") : systemPrompt;

      const messages = [
        { role: "system", content: fullPrompt },
        ...history,
        { role: "user", content: userMessage },
      ];

      await message.channel.sendTyping();
      const response = await ollama.chat(messages);
      memory.addMessage(`dm_${message.author.id}`, "user", userMessage);
      memory.addMessage(`dm_${message.author.id}`, "assistant", response);
      await message.reply(response);
    } catch (e) {
      console.error("DM error:", e);
      await message.reply("Error: " + e.message);
    }
    return;
  }

  if (startsWithAdmin || (inAdminChannel && isOwnerDirect)) {
    await handleAdminCommand(message);
    return;
  }

  if (!mentioned && !startsWithPrefix) return;

  const running = await ollama.isRunning();
  if (!running) {
    await message.reply(
      "Ollama is not running! Start your Ollama server first."
    );
    return;
  }

  let userMessage = message.content;
  if (mentioned) {
    userMessage = userMessage.replace(/<@!?\d+>/g, "").trim();
  } else if (startsWithPrefix) {
    userMessage = userMessage.slice(PREFIX.length).trim();
  }

  if (!userMessage) {
    await message.reply("Hey! Ask me something or use /help for commands.");
    return;
  }

  const channelId = message.channel.id;
  const history = memory.getHistory(channelId);

  const guild = message.guild;
  const systemPrompt = knowledge.getSystemPrompt(guild);

    const messages = [
      { role: "system", content: systemPromptWithLearned },
      ...history,
      { role: "user", content: userMessage },
    ];

  try {
    await message.channel.sendTyping();
    const response = await ollama.chat(messages);
    memory.addMessage(channelId, "user", userMessage);
    memory.addMessage(channelId, "assistant", response);

    if (response.length > 2000) {
      const chunks = [];
      for (let i = 0; i < response.length; i += 1990) {
        chunks.push(response.slice(i, i + 1990));
      }
      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          await message.reply(chunks[i]);
        } else {
          await message.channel.send(chunks[i]);
        }
      }
    } else {
      await message.reply(response);
    }
  } catch (error) {
    console.error("Chat error:", error);
    await message.reply("Failed to get response from Ollama.");
  }

  if (!mentioned) {
    xp.addXP(message.guild.id, message.author.id, 5);
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  await welcome.sendWelcome(member);
});

async function handleAdminCommand(message) {
  if (!isOwner(message.author.id)) {
    await message.reply("Only the bot owner can use admin commands.");
    return;
  }

  const content = message.content.trim();

  if (brain && content.length > 5) {
    const running = await ollama.isRunning();
    if (running) {
      try {
        await message.channel.sendTyping();
        const result = await brain.think(message.guild, content, { isOwner: true });

        if (result.action && result.action !== "none" && result.action !== "answer" && result.action !== "research") {
          if (intelligence.hasPermission(result.action)) {
            const actionResult = await brain.executeAction(
              message.guild,
              result.action,
              result.target,
              result.targetName,
              result.details || {},
              message
            );
            await message.reply(actionResult);
            return;
          }
        }
        await message.reply(result.response || "I understood your request.");
        return;
      } catch (e) {
        console.error("Brain message error:", e);
      }
    }
  }

  const isAdmin = content.startsWith(ADMIN_PREFIX);
  const args = isAdmin ? content.slice(ADMIN_PREFIX.length).trim().split(" ") : content.split(" ");
  const cmd = args[0]?.toLowerCase();
  const rest = isAdmin ? args.slice(1).join(" ") : content;

  try {
    const lowerCmd = cmd || "";
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("create") && lowerContent.includes("channel")) {
      const name = content.replace(/.*create.*channel\s*/i, "").trim().toLowerCase().replace(/\s+/g, "-");
      const channel = await message.guild.channels.create({ name, type: 0 });
      await message.reply(`Created channel: ${channel}`);
    } else if (lowerContent.includes("create") && lowerContent.includes("role")) {
      const name = content.replace(/.*create.*role\s*/i, "").trim();
      const role = await message.guild.roles.create({ name });
      await message.reply(`Created role: @${name}`);
    } else if (lowerContent.includes("delete") && lowerContent.includes("channel")) {
      const name = content.replace(/.*delete.*channel\s*/i, "").replace(/.*delete\s*/i, "").trim();
      const channel = message.guild.channels.cache.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
      if (channel) {
        await channel.delete();
        await message.reply(`Deleted channel: ${name}`);
      } else {
        await message.reply(`Channel not found: ${name}`);
      }
    } else if (lowerContent.includes("post") || lowerContent.includes("announce")) {
      const postContent = content.replace(/.*(post|announce)\s*/i, "").trim();
      const channel = message.guild.channels.cache.find(c => c.type === 5) || message.channel;
      await channel.send(postContent);
      await message.reply(`Posted in #${channel.name}`);
    } else if (lowerContent.includes("kick")) {
      const user = message.mentions.users.first();
      if (user) {
        const member = await message.guild.members.fetch(user.id);
        await member.kick("Kicked by owner");
        await message.reply(`Kicked ${user.tag}`);
      }
    } else if (lowerContent.includes("ban")) {
      const banUser = message.mentions.users.first();
      if (banUser) {
        const member = await message.guild.members.fetch(banUser.id);
        await member.ban({ reason: "Banned by owner" });
        await message.reply(`Banned ${banUser.tag}`);
      }
    } else {
      await message.reply(`Try: create channel <name>, create role <name>, delete channel <name>, post <message>, kick @user, ban @user`);
    }
  } catch (error) {
    console.error("Admin command error:", error);
    await message.reply("Error executing: " + error.message);
  }
}

client.on(Events.GuildMemberAdd, async (member) => {
  events.recordJoin(member.id, member.user.username);
  const joinMsg = events.getJoinMessage();
  const channel = member.guild.systemChannel;
  if (channel && joinMsg) {
    await channel.send(joinMsg.replace("{user}", member.user.username));
  }
});

client.on(Events.GuildMemberRemove, async (member) => {
  events.recordLeave(member.id, member.user.username);
  const leaveMsg = events.getLeaveMessage();
  const channel = member.guild.systemChannel;
  if (channel && leaveMsg) {
    await channel.send(leaveMsg.replace("{user}", member.user.username));
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  const response = events.getReactionResponse(reaction.emoji.name);
  if (response) {
    await reaction.message.reply(response.replace("{user}", user.username));
  }
});

client.login(process.env.DISCORD_TOKEN);
