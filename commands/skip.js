const { SlashCommandBuilder } = require("discord.js");
const music = require("../utils/music");

const data = new SlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip the current song");

async function execute(interaction) {
  const result = await music.skip(interaction.guild.id);
  await interaction.reply(result);
}

module.exports = { data, execute };