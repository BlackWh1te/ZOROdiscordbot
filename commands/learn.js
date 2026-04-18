const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const knowledge = require("../utils/knowledge");

const data = new SlashCommandBuilder()
  .setName("learn")
  .setDescription("Teach the bot about your server")
  .addStringOption((option) =>
    option.setName("type").setDescription("What to teach")
      .addChoices(
        { name: "Server name", value: "servername" },
        { name: "Rule", value: "rule" },
        { name: "Channel", value: "channel" },
        { name: "Role", value: "role" },
        { name: "Info", value: "info" },
        { name: "Show all", value: "show" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("value").setDescription("The value to learn")
  );

async function execute(interaction) {
  const type = interaction.options.getString("type");
  const value = interaction.options.getString("value") || "";

  if (type === "show") {
    const data = knowledge.loadKnowledge();
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Bot Knowledge")
      .addFields(
        { name: "Server Name", value: data.serverName || "Not set", inline: true },
        { name: "Rules", value: data.rules.length > 0 ? data.rules.join("\n") : "None", inline: false },
        { name: "Channels", value: data.channels.length > 0 ? data.channels.map(c => `#${c.name}: ${c.purpose}`).join("\n") : "None", inline: false },
        { name: "Roles", value: data.roles.length > 0 ? data.roles.map(r => `@${r.name}: ${r.description}`).join("\n") : "None", inline: false }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (type === "servername") {
    knowledge.updateKnowledge("serverName", value);
    return interaction.reply(`Server name set to: ${value}`);
  }

  if (type === "rule") {
    knowledge.addRule(value);
    return interaction.reply(`Rule added: ${value}`);
  }

  if (type === "channel") {
    const parts = value.split(" - ");
    const name = parts[0].trim();
    const purpose = parts[1]?.trim() || "General";
    knowledge.addChannel(name, purpose);
    return interaction.reply(`Channel learned: #${name} - ${purpose}`);
  }

  if (type === "role") {
    const parts = value.split(" - ");
    const name = parts[0].trim();
    const description = parts[1]?.trim() || "Member";
    knowledge.addRole(name, description);
    return interaction.reply(`Role learned: @${name} - ${description}`);
  }

  if (type === "info") {
    const [key, ...valParts] = value.split(":");
    const keyTrim = key.trim();
    const val = valParts.join(":").trim() || value;
    const data = knowledge.loadKnowledge();
    data.customInfo[keyTrim] = val;
    knowledge.saveKnowledge(data);
    return interaction.reply(`Info learned: ${keyTrim} = ${val}`);
  }

  await interaction.reply("Use /learn show to see what the bot has learned.");
}

module.exports = { data, execute };