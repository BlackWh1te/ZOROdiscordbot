const monitors = new Map();

function addMonitor(channelId, options = {}) {
  const id = "mon_" + Date.now();
  monitors.set(id, {
    channelId,
    interval: options.interval || 1800000,
    lastCheck: 0,
    enabled: true,
    analyze: options.analyze || false,
    respondEmoji: options.respondEmoji || null,
    respondToUser: options.respondToUser || null
  });
  return id;
}

function removeMonitor(id) {
  monitors.delete(id);
}

function getMonitors() {
  return Array.from(monitors.entries()).map(([id, m]) => ({
    id,
    channel: m.channelId,
    enabled: m.enabled,
    interval: m.interval
  }));
}

async function checkMonitors(client, ollama) {
  for (const [id, monitor] of monitors) {
    if (!monitor.enabled) continue;
    if (Date.now() - monitor.lastCheck < monitor.interval) continue;

    try {
      const channel = await client.channels.fetch(monitor.channelId);
      if (!channel) continue;

      const messages = await channel.messages.fetch({ limit: 5 });
      if (messages.size === 0) continue;

      const lastMsg = messages.first();
      if (!lastMsg) continue;

      const user = lastMsg.author;
      if (user.bot) continue;

      monitor.lastCheck = Date.now();

      if (monitor.respondEmoji) {
        const hasReaction = lastMsg.reactions.cache.some(r => r.emoji.name === monitor.respondEmoji);
        if (!hasReaction) {
          await lastMsg.react(monitor.respondEmoji);
        }
      }

      if (monitor.analyze && ollama) {
        const recent = Array.from(messages.values()).slice(0, 3).reverse().map(m =>
          m.author.username + ": " + m.content.substring(0, 100)
        ).join("\n");

        const prompt = `Analyze this recent Discord conversation and provide insights:

${recent}

Give a brief analysis (1-2 sentences).`;

        const analysis = await ollama.generate(prompt);
        await channel.send("📊 **Quick Analysis:** " + analysis.substring(0, 500));
      }
    } catch (e) {
      console.error("Monitor error:", e);
    }
  }
}

function startMonitorLoop(client, ollama, interval = 60000) {
  setInterval(() => checkMonitors(client, ollama), interval);
}

module.exports = { addMonitor, removeMonitor, getMonitors, checkMonitors, startMonitorLoop };