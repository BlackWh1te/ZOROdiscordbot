const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("brain")
  .setDescription("Ask the AI to think and act on your server")
  .addStringOption((option) =>
    option.setName("request").setDescription("What you want the AI to do or know").setRequired(true)
  );

async function execute(interaction, { brain, knowledge }) {
  await interaction.deferReply();

  try {
    const request = interaction.options.getString("request");
    const result = await brain.think(interaction.guild, request, {});

    if (result.action && result.action !== "none" && result.action !== "answer") {
      const actionResult = await brain.executeAction(
        interaction.guild,
        result.action,
        result.target,
        result.targetName,
        result.details,
        interaction
      );

      const embed = new EmbedBuilder()
        .setColor(result.action === "create" ? 0x00ff00 : 0xffaa00)
        .setTitle("AI Thought Process")
        .addFields(
          { name: "Request", value: request, inline: false },
          { name: "Analyzed Action", value: result.action, inline: true },
          { name: "Target", value: result.target || "none", inline: true },
          { name: "Result", value: actionResult || result.response, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.editReply(result.response || "I understood your request.");
    }
  } catch (error) {
    console.error("Brain command error:", error);
    await interaction.editReply("Error: " + error.message);
  }
}

module.exports = { data, execute };