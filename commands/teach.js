const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ml = require("../utils/ml");

const data = new SlashCommandBuilder()
  .setName("teach")
  .setDescription("Teach the bot from interactions")
  .addStringOption((option) =>
    option.setName("action").setDescription("What to teach")
      .addChoices(
        { name: "Response", value: "response" },
        { name: "Pattern", value: "pattern" },
        { name: "Correction", value: "correction" },
        { name: "Fact", value: "fact" },
        { name: "Stats", value: "stats" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("input").setDescription("Input trigger")
  )
  .addStringOption((option) =>
    option.setName("output").setDescription("Expected output/action")
  );

async function execute(interaction) {
  const action = interaction.options.getString("action");
  const input = interaction.options.getString("input") || "";
  const output = interaction.options.getString("output") || "";

  if (action === "stats") {
    const score = ml.getIntelligenceScore();
    const facts = ml.getLearnedFacts();
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("Bot Intelligence Stats")
      .addFields(
        { name: "Patterns Learned", value: score.patterns.toString(), inline: true },
        { name: "Responses Learned", value: score.responses.toString(), inline: true },
        { name: "Actions Recorded", value: score.actions.toString(), inline: true },
        { name: "Corrections", value: score.corrections.toString(), inline: true },
        { name: "Facts Known", value: score.learnedFacts.toString(), inline: true },
        { name: "Intelligence Score", value: score.score.toString(), inline: true }
      )
      .setTimestamp();

    if (facts.length > 0) {
      embed.addFields({ name: "Known Facts", value: facts.join("\n").slice(0, 1024), inline: false });
    }

    return interaction.reply({ embeds: [embed] });
  }

  if (action === "response" && input && output) {
    ml.learnResponse(input, output);
    return interaction.reply(`Learned: "${input}" → "${output}"`);
  }

  if (action === "pattern" && input && output) {
    ml.learnPattern(input, output, "contains");
    return interaction.reply(`Pattern learned: contains "${input}" → "${output}"`);
  }

  if (action === "fact" && output) {
    ml.addLearnedFact(output);
    return interaction.reply(`Fact learned: ${output}`);
  }

  if (action === "correction" && input && output) {
    ml.recordCorrection(input, output, "manual");
    return interaction.reply(`Correction recorded: "${input}" → "${output}"`);
  }

  await interaction.reply("Use /teach stats to see what the bot has learned.");
}

module.exports = { data, execute };