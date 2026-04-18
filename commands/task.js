const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const ollama = require("../utils/ollama");

const data = new SlashCommandBuilder()
  .setName("task")
  .setDescription("Give the bot a task")
  .addStringOption((option) =>
    option.setName("task").setDescription("What you want bot to do").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("details").setDescription("Additional details")
  )
  .addUserOption((option) =>
    option.setName("user").setDescription("User (for role commands)")
  );

const channelTypes = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  category: ChannelType.GuildCategory,
  announcement: ChannelType.GuildAnnouncement,
};

async function execute(interaction, { client }) {
  const task = interaction.options.getString("task").toLowerCase();
  const details = interaction.options.getString("details") || "";

  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({ content: "Ollama not running!", ephemeral: true });
  }

  await interaction.deferReply();

  const targetUser = interaction.options.getUser("user");
  const targetMember = targetUser ? await interaction.guild.members.fetch(targetUser.id) : null;

  try {
    if (task.includes("create channel") || task.includes("new channel") || task.includes("add channel")) {
      await handleCreateChannel(interaction, task, details);
    } else if (task.includes("rename channel") || task.includes("change name")) {
      await handleRenameChannel(interaction, task, details);
    } else if (task.includes("make post") || task.includes("announcement") || task.includes("update") || task.includes("announce")) {
      await handleMakePost(interaction, task, details);
    } else if (task.includes("delete channel")) {
      await handleDeleteChannel(interaction, task, details);
    } else if (task.includes("create role") || task.includes("new role")) {
      await handleCreateRole(interaction, task, details);
    } else if ((task.includes("add role") || task.includes("give role") || task.includes("remove role") || task.includes("take role")) && targetMember) {
      await handleManageRole(interaction, task, details, targetMember);
    } else if (task.includes("setup") || task.includes("configure")) {
      await handleSetup(interaction, task, details);
    } else {
      const prompt = `Task: ${task}\nDetails: ${details}\n\nThis is a Discord bot task. Provide clear, actionable steps or execute if possible. If you need to create content, write it in a clean format.`;
      const response = await ollama.generate(prompt);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Task Result")
        .setDescription(response.slice(0, 4096))
        .setFooter({ text: "Use /task for various bot tasks" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Task error:", error);
    await interaction.editReply("Error executing task.");
  }
}

async function handleCreateChannel(interaction, task, details) {
  const prompt = `Generate a proper Discord channel name from this request: "${task} ${details}". Use kebab-case (lowercase with dashes). reply ONLY with the channel name, nothing else.`;
  const channelName = (await ollama.generate(prompt)).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  let channelType = ChannelType.GuildText;
  if (task.includes("voice")) channelType = ChannelType.GuildVoice;
  if (task.includes("announcement") || task.includes("announce")) channelType = ChannelType.GuildAnnouncement;

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: channelType,
  });

  await interaction.editReply(`Created channel: ${channel}`);
}

async function handleRenameChannel(interaction, task, details) {
  const prompt = `Generate a proper Discord channel name from: "${details}". Use kebab-case. Reply ONLY the name.`;
  const newName = (await ollama.generate(prompt)).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const channel = interaction.channel;
  await channel.setName(newName);

  await interaction.editReply(`Renamed channel to: ${newName}`);
}

async function handleMakePost(interaction, task, details) {
  let channel = interaction.channel;

  if (task.includes("announcement") || task.includes("updates")) {
    const announcementChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildAnnouncement);
    if (announcementChannels.size > 0) {
      channel = announcementChannels.first();
    }
  }

  const prompt = `Create a Discord announcement/update post. Task: ${task} ${details}\n\nFormat nicely with:\n- Attention-grabbing title\n- Clean formatting\n- Emoji where appropriate\n- Call to action if needed\n\nWrite in a engaging but professional style.`;
  const content = await ollama.generate(prompt);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setDescription(content.slice(0, 4096))
    .setTimestamp();

  if (interaction.guild.iconURL()) {
    embed.setThumbnail(interaction.guild.iconURL());
  }

  await channel.send({ embeds: [embed] });
  await interaction.editReply(`Posted in #${channel.name}`);
}

async function handleDeleteChannel(interaction, task, details) {
  const channelName = details.trim();
  const channel = interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes(channelName.toLowerCase()));

  if (!channel) {
    return interaction.editReply(`Channel "${channelName}" not found.`);
  }

  await channel.delete();
  await interaction.editReply(`Deleted channel: ${channelName}`);
}

async function handleCreateRole(interaction, task, details) {
  const prompt = `Generate a Discord role name from: "${task} ${details}". Reply ONLY the role name.`;
  const roleName = (await ollama.generate(prompt)).trim();

  let color = 0x5865F2;
  if (task.includes("admin")) color = 0xff0000;
  if (task.includes("mod")) color = 0xfee75c;
  if (task.includes("vip")) color = 0xffaa00;

  const role = await interaction.guild.roles.create({
    name: roleName,
    color: color,
  });

  await interaction.editReply(`Created role: @${roleName}`);
}

async function handleManageRole(interaction, task, details, targetUser) {
  const roleName = details.replace(/<@!?\d+>/g, "").trim();
  const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));

  if (!role) {
    return interaction.editReply(`Role "${roleName}" not found.`);
  }

  if (task.includes("add") || task.includes("give")) {
    await targetUser.roles.add(role);
    await interaction.editReply(`Added @${roleName} to ${targetUser.user.username}`);
  } else if (task.includes("remove") || task.includes("take")) {
    await targetUser.roles.remove(role);
    await interaction.editReply(`Removed @${roleName} from ${targetUser.user.username}`);
  }
}

async function handleSetup(interaction, task, details) {
  const prompt = `Discord server setup for: ${task} ${details}\n\nProvide:\n1. Recommended channels with purposes\n2. Role hierarchy\n3. Best practices\n\nFormat as markdown.`;
  const response = await ollama.generate(prompt);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Server Setup Guide")
    .setDescription(response.slice(0, 4096))
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

module.exports = { data, execute };