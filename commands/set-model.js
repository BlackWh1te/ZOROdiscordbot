const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("set-model")
  .setDescription("Switch AI model")
  .addStringOption((option) =>
    option.setName("model").setDescription("Model name").setRequired(true)
  );

async function execute(interaction, { ollama }) {
  const model = interaction.options.getString("model");

  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({
      content: "Ollama is not running!",
      ephemeral: true,
    });
  }

  try {
    const models = await ollama.listModels();
    const modelNames = models.map((m) => m.name);
    const match = modelNames.find(
      (n) => n === model || n.toLowerCase().includes(model.toLowerCase())
    );

    if (match) {
      ollama.setModel(match);
      await interaction.reply({
        content: `Model switched to **${match}**`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Model "${model}" not found. Available: ${modelNames.join(", ")}`,
        ephemeral: true,
      });
    }
  } catch (error) {
    await interaction.reply({
      content: "Error switching model.",
      ephemeral: true,
    });
  }
}

module.exports = { data, execute };