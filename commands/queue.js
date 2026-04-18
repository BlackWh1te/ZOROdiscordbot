const { SlashCommandBuilder } = require("discord.js");
const music = require("../utils/music");

const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("Show music queue");

async function execute(interaction) {
  const result = await music.queue(interaction.guild.id);
  await interaction.reply(result);
}

module.exports = { data, execute };