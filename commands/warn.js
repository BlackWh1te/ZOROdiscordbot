const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const moderation = require("../utils/moderation");

const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warn a member")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to warn").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason")
  );

async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason";
  const moderator = interaction.user.tag;

  const count = moderation.warnUser(
    interaction.guild.id,
    user.id,
    reason,
    moderator
  );

  const embed = new EmbedBuilder()
    .setColor(0xffaa00)
    .setTitle("User Warned")
    .setDescription(`${user.tag} has been warned.`)
    .addFields(
      { name: "Reason", value: reason },
      { name: "Total Warns", value: count.toString() }
    );

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };