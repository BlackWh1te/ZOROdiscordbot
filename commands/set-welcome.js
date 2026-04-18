const { SlashCommandBuilder } = require("discord.js");
const welcome = require("../utils/welcome");

const data = new SlashCommandBuilder()
  .setName("set-welcome")
  .setDescription("Set the welcome channel")
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Welcome channel").setRequired(true)
  );

async function execute(interaction) {
  const channel = interaction.options.getChannel("channel");

  welcome.setWelcomeChannel(interaction.guild.id, channel.id);

  await interaction.reply(`Welcome channel set to ${channel}`);
}

module.exports = { data, execute };