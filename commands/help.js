const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show bot help information");

async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("DSbot - Local AI Discord Bot")
    .setDescription(
      "A Discord bot powered by your local Ollama AI."
    )
    .addFields(
      { name: "Chat", value: "`/ask` - Ask AI\n`/clear` - Clear memory", inline: true },
      { name: "Music", value: "`/play` - Play song\n`/skip` - Skip\n`/stop` - Stop\n`/queue` - Show queue", inline: true },
      { name: "Moderation", value: "`/kick` - Kick member\n`/ban` - Ban member\n`/warn` - Warn member", inline: true },
      { name: "Tools", value: "`/poll` - Create poll\n`/remind` - Set reminder\n`/stats` - Server stats\n`/level` - Check level", inline: true },
      { name: "Server Setup", value: "`/setup-server` - Setup guide\n`/manage-channel` - Channel advice\n`/set-welcome` - Set welcome channel", inline: true },
      { name: "AI Settings", value: "`/models` - List models\n`/set-model` - Switch model\n`/status` - Check status", inline: true }
    )
    .setFooter({ text: "Mention bot or use !ai to chat" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };