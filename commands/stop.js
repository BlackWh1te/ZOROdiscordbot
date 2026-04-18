const { SlashCommandBuilder } = require("discord.js");
const music = require("../utils/music");

const data = new SlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop the music");

async function execute(interaction) {
  const result = await music.stop(interaction.guild.id);
  await interaction.reply(result);
}

module.exports = { data, execute };