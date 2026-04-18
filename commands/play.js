const { SlashCommandBuilder } = require("discord.js");
const music = require("../utils/music");

const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song")
  .addStringOption((option) =>
    option.setName("query").setDescription("Song name or URL").setRequired(true)
  );

async function execute(interaction, { client }) {
  const query = interaction.options.getString("query");

  if (!interaction.member.voice.channel) {
    return interaction.reply({ content: "Join a voice channel first!", ephemeral: true });
  }

  const channel = interaction.member.voice.channel;

  await interaction.deferReply();

  const result = await music.addSong(interaction.guild.id, channel, query, client);

  await interaction.editReply(result);
}

module.exports = { data, execute };