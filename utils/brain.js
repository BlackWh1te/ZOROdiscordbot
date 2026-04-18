const { ChannelType, PermissionFlagsBits } = require("discord.js");

class DiscordBrain {
  constructor(client, ollama, knowledge, ml) {
    this.client = client;
    this.ollama = ollama;
    this.knowledge = knowledge;
    this.ml = ml;
  }

  async analyzeServer(guild) {
    const channels = guild.channels.cache;
    const roles = guild.roles.cache;
    const members = guild.members.cache;

    let channelList = [];
    let categoryChannels = {};

    channels.forEach(ch => {
      if (ch.type === ChannelType.GuildCategory) {
        categoryChannels[ch.id] = { name: ch.name, channels: [] };
      } else if (ch.parentId && categoryChannels[ch.parentId]) {
        categoryChannels[ch.parentId].channels.push({ name: ch.name, type: ch.type.toString() });
      } else if (!ch.parentId) {
        channelList.push({ name: ch.name, type: ch.type.toString() });
      }
    });

    let roleList = roles.filter(r => r.name !== "@everyone").map(r => ({
      name: r.name,
      color: r.hexColor,
      position: r.position,
      permissions: r.permissions.toArray().slice(0, 10)
    }));

    return {
      name: guild.name,
      members: members.size,
      bots: members.filter(m => m.user.bot).size,
      channels: channels.size,
      roles: roles.size - 1,
      channelList,
      categoryChannels,
      roleList
    };
  }

  async think(guild, userMessage, context = {}) {
    const serverInfo = await this.analyzeServer(guild);
    const knowledgeData = this.knowledge.loadKnowledge();

    const prompt = `You are an advanced AI controlling a Discord server. 

AVAILABLE ACTIONS (You CAN DO):
- Create/delete channels and roles
- Kick/ban members
- Manage member roles
- Send messages and announcements
- Answer questions about the server
- Analyze server data
- Learn and remember information

LIMITATIONS (You CANNOT DO):
- Delete messages in bulk (only individual)
- Change server settings (name, icon)
- Access external websites
- Process files or downloads
- Execute code outside Discord
- Access other servers

SERVER INFORMATION:
- Name: ${serverInfo.name}
- Members: ${serverInfo.members}
- Channels: ${serverInfo.channels}
- Roles: ${serverInfo.roles}

SERVER CATEGORIES:
${JSON.stringify(serverInfo.categoryChannels, null, 2)}

KNOWN INFO:
${JSON.stringify(knowledgeData, null, 2)}

USER REQUEST: "${userMessage}"

Understand what the user wants. If they ask for something impossible or outside your capabilities:
- Politely explain you cannot do that
- Offer an alternative if possible

If possible, take action. If asking a question, answer directly.

Respond in JSON:
{
  "action": "none" | "answer" | "create" | "delete" | "modify" | "manage" | "analyze" | "cannot",
  "target": "channel" | "role" | "member" | "message" | "server" | "none",
  "targetName": "name of target",
  "details": {},
  "response": "Your response (be honest if you cannot do something)",
  "reason": "why you can/cannot do this"
}`;

    try {
      const result = await this.ollama.generate(prompt);
      return this.parseResponse(result);
    } catch (e) {
      console.error("Brain think error:", e);
      return { action: "answer", target: "none", response: "I'm thinking... but encountered an error." };
    }
  }

  parseResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
    return { action: "answer", target: "none", response: text };
  }

  async parseRequest(userMessage) {
    const prompt = `You are a message parser. Parse this user message and extract the intent.

USER MESSAGE: "${userMessage}"

Parse it and respond in JSON:
{
  "action": "schedule" | "send" | "add_task" | "complete_task" | "remove_task" | "show_tasks" | "create_channel" | "create_role" | "answer" | "unknown",
  "target_channel": "channel name or null",
  "target_channel_type": "here" | "specific" | "default",
  "interval_num": number or null,
  "interval_unit": "minute" | "hour" | "day" | null,
  "content": "what to send/post",
  "task_name": "name for task list item or null",
  "task_details": "details for task or null",
  "clarification_needed": "what to ask if unclear, or null",
  "ambiguous_words": ["any words that could be misspelled or unclear"],
  "confidence": 0-100
}`;

    try {
      const result = await this.ollama.generate(prompt);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("parseRequest error:", e);
    }
    return { action: "unknown", confidence: 0, clarification_needed: "Could not parse. Try again?" };
  }

  async parseTaskAction(userMessage) {
    const prompt = `You are a task command parser. Parse task-related commands.

USER MESSAGE: "${userMessage}"

Actions: complete #XXX, delete #XXX, remove #XXX, show task list

Respond in JSON:
{
  "action": "complete" | "remove" | "show" | "unknown",
  "task_id": 3-digit number from #XXX or null,
  "confidence": 0-100
}`;

    try {
      const result = await this.ollama.generate(prompt);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("parseTaskAction error:", e);
    }
    return { action: "unknown", confidence: 0 };
  }

  async executeAction(guild, action, target, targetName, details, message) {
    try {
      const fullContent = (targetName || "") + " " + (details?.message || "");
      const lowerContent = fullContent.toLowerCase();

      if (action === "cannot" || action === "none") {
        return details?.response || "Sorry, I can't do that. " + (details?.reason || "It's outside my capabilities.");
      }

      switch (action) {
        case "send":
        case "post":
        case "message":
          if (target === "channel" || targetName) {
            const channelName = targetName || details?.channel;
            const channel = guild?.channels.cache.find(c => c.name.toLowerCase().includes(channelName?.toLowerCase()));
            if (channel) {
              await channel.send(details?.message || targetName);
              return "Sent!";
            }
            const channelById = guild?.channels.cache.get(targetName);
            if (channelById) {
              await channelById.send(details?.message || targetName);
              return "Sent!";
            }
            return "Channel not found: " + channelName;
          }
          if (message) {
            await message.channel.send(details?.message || targetName);
            return "Sent!";
          }
          break;
        case "create":
          if (target === "channel") {
            let name = targetName?.toLowerCase().replace(/\s+/g, "-") || details.name?.toLowerCase().replace(/\s+/g, "-");

            const categoryKeywords = ["general", "gaming", "talk", "voice", "admin", "events", "media", "info"];
            let category = null;
            for (const kw of categoryKeywords) {
              if (lowerContent.includes(kw)) {
                const cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes(kw));
                if (cat) {
                  category = cat;
                  break;
                }
              }
            }

            const type = (details?.type || lowerContent.includes("voice")) ? ChannelType.GuildVoice : ChannelType.GuildText;
            const opts = { name, type };
            if (category) opts.parent = category;

            const channel = await guild.channels.create(opts);
            return category ? `Created #${channel.name} in ${category.name}` : `Created #${channel.name}`;
          }
          if (target === "role") {
            const role = await guild.roles.create({ name: targetName || details.name });
            return `Created role: @${role.name}`;
          }
          break;

        case "delete":
          if (target === "channel") {
            const channel = guild.channels.cache.find(c => c.name.toLowerCase().includes(targetName?.toLowerCase()));
            if (channel) {
              await channel.delete();
              return `Deleted channel: #${targetName}`;
            }
            return `Channel not found: ${targetName}`;
          }
          if (target === "role") {
            const role = guild.roles.cache.find(r => r.name.toLowerCase().includes(targetName?.toLowerCase()));
            if (role) {
              await role.delete();
              return `Deleted role: @${targetName}`;
            }
            return `Role not found: ${targetName}`;
          }
          break;

        case "kick":
           if (target === "member") {
             const user = message.mentions.users.first();
             if (user) {
               const member = await guild.members.fetch(user.id);
               if (member) {
                 if (member.kickable) {
                   const reason = details?.reason || "No reason provided";
                   await member.kick({ reason });
                   return `Kicked ${user.tag}. Reason: ${reason}`;
                 } else {
                   return `Cannot kick ${user.tag} - insufficient permissions or user is too high in hierarchy`;
                 }
               }
             }
             return "Member not found";
           }
           break;
        case "ban":
           if (target === "member") {
             const user = message.mentions.users.first();
             if (user) {
               const member = await guild.members.fetch(user.id);
               if (member) {
                 if (member.bannable) {
                   const reason = details?.reason || "No reason provided";
                   await member.ban({ reason });
                   return `Banned ${user.tag}. Reason: ${reason}`;
                 } else {
                   return `Cannot ban ${user.tag} - insufficient permissions or user is too high in hierarchy`;
                 }
               }
             }
             return "Member not found";
           }
           break;
        case "manage":
           if (target === "member") {
             const user = message.mentions.users.first();
             if (user) {
               const member = await guild.members.fetch(user.id);
               if (details.addRole) {
                 const role = guild.roles.cache.find(r => r.name.toLowerCase().includes(details.addRole.toLowerCase()));
                 if (role) {
                   await member.roles.add(role);
                   return `Added role @${details.addRole} to ${user.username}`;
                 }
               }
               if (details.removeRole) {
                 const role = guild.roles.cache.find(r => r.name.toLowerCase().includes(details.removeRole.toLowerCase()));
                 if (role) {
                   await member.roles.remove(role);
                   return `Removed role @${details.removeRole} from ${user.username}`;
                 }
               }
             }
             return "Member not found or no action specified";
           }
           break;

        default:
          return "Action not recognized";
      }
    } catch (e) {
      console.error("Execute action error:", e);
      return `Error: ${e.message}`;
    }
  }
}

module.exports = DiscordBrain;