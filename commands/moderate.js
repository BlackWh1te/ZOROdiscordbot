const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const modAI = require("../utils/moderation-ai");

const data = new SlashCommandBuilder()
  .setName("moderate")
  .setDescription("AI Moderation settings")
  .addStringOption((option) =>
    option.setName("action").setDescription("Action to take")
      .addChoices(
        { name: "Enable", value: "enable" },
        { name: "Disable", value: "disable" },
        { name: "Stats", value: "stats" },
        { name: "History", value: "history" },
        { name: "Add Blocked Word", value: "block" },
        { name: "Remove Blocked Word", value: "unblock" },
        { name: "Set Log Channel", value: "log" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("value").setDescription("Value (word or channel)")
  );

async function execute(interaction) {
  const action = interaction.options.getString("action");
  const value = interaction.options.getString("value") || "";

  if (action === "enable") {
    modAI.toggleEnabled(true);
    return interaction.reply("AI Moderation enabled!");
  }

  if (action === "disable") {
    modAI.toggleEnabled(false);
    return interaction.reply("AI Moderation disabled.");
  }

  if (action === "stats") {
    const stats = modAI.getStats();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Moderation Stats")
      .addFields(
        { name: "Warnings", value: stats.warnings?.toString() || "0", inline: true },
        { name: "Kicks", value: stats.kicks?.toString() || "0", inline: true },
        { name: "Bans", value: stats.bans?.toString() || "0", inline: true },
        { name: "Deleted Messages", value: stats.deleted?.toString() || "0", inline: true }
      )
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  if (action === "history") {
    const history = modAI.getHistory(10);
    const list = history.map(h => `${h.action}: ${h.user} - ${h.reason}`).join("\n") || "No history";
    return interaction.reply(`Recent Moderation History:\n${list}`);
  }

  if (action === "block" && value) {
    modAI.addBlockedWord(value);
    return interaction.reply(`Blocked word added: ${value}`);
  }

  if (action === "unblock" && value) {
    modAI.removeBlockedWord(value);
    return interaction.reply(`Blocked word removed: ${value}`);
  }

  if (action === "log") {
    modAI.setLogChannel(interaction.channel.id);
    return interaction.reply("Log channel set to this channel.");
  }

  await interaction.reply("Use /moderate stats to see moderation stats.");
}

module.exports = { data, execute };