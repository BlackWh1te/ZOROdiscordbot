const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Check bot and Ollama status");

async function execute(interaction, { ollama }) {
  const running = await ollama.isRunning();

  const embed = new EmbedBuilder()
    .setColor(running ? 0x00ff00 : 0xff0000)
    .setTitle("DSbot Status")
    .addFields(
      {
        name: "Bot Status",
        value: "Online",
        inline: true,
      },
      {
        name: "Ollama Status",
        value: running ? "Connected" : "Not Running",
        inline: true,
      },
      {
        name: "Current Model",
        value: running ? ollama.getModel() : "N/A",
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };