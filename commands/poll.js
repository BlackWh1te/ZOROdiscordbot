const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("poll")
  .setDescription("Create a poll")
  .addStringOption((option) =>
    option.setName("question").setDescription("Poll question").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("options").setDescription("Options (comma separated)").setRequired(true)
  );

async function execute(interaction) {
  const question = interaction.options.getString("question");
  const options = interaction.options.getString("options").split(",").map(o => o.trim());

  if (options.length < 2) {
    return interaction.reply({ content: "At least 2 options required.", ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Poll")
    .setDescription(`**${question}**\n\n${options.map((o, i) => `${i + 1}. ${o}`).join("\n")}`)
    .setTimestamp();

  const buttons = options.map((o, i) =>
    new ButtonBuilder()
      .setCustomId(`poll_${i}`)
      .setLabel(o)
      .setStyle(ButtonStyle.Primary)
  );

  const row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));

  await interaction.reply({ embeds: [embed], components: [row] });
}

module.exports = { data, execute };