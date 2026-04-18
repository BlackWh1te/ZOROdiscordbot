const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const xp = require("../utils/xp");

const data = new SlashCommandBuilder()
  .setName("level")
  .setDescription("Check your level")
  .addUserOption((option) =>
    option.setName("user").setDescription("User (optional)")
  );

async function execute(interaction) {
  const user = interaction.options.getUser("user") || interaction.user;
  const stats = xp.getXP(interaction.guild.id, user.id);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`${user.username}'s Level`)
    .setDescription(`Level: **${stats.level}**\nXP: ${stats.xp}/${stats.level * 100}`)
    .setThumbnail(user.displayAvatarURL());

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };