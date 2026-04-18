const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("models")
  .setDescription("List available Ollama models");

async function execute(interaction, { ollama }) {
  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({
      content: "Ollama is not running!",
      ephemeral: true,
    });
  }

  try {
    const models = await ollama.listModels();
    const current = ollama.getModel();

    if (models.length === 0) {
      return interaction.reply({
        content: "No models found. Pull one with: ollama pull llama3.2",
        ephemeral: true,
      });
    }

    const list = models
      .map((m) => {
        const size = (m.size / 1073741824).toFixed(2);
        const indicator = m.name === current ? " [ACTIVE]" : "";
        return `* ${m.name} (${size} GB)${indicator}`;
      })
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Available Ollama Models")
      .setDescription(list)
      .setFooter({ text: "Use /set-model to switch" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    await interaction.reply({
      content: "Error listing models.",
      ephemeral: true,
    });
  }
}

module.exports = { data, execute };