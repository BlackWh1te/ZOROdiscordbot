const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("Server statistics");

async function execute(interaction) {
  const guild = interaction.guild;

  const totalMembers = guild.memberCount;
  const bots = guild.members.cache.filter(m => m.user.bot).size;
  const humans = totalMembers - bots;

  const online = guild.presences.cache.filter(p => p.status === "online").size;

  const channels = guild.channels.cache.size;
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
  const roles = guild.roles.cache.size;

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${guild.name} Statistics`)
    .setThumbnail(guild.iconURL())
    .addFields(
      { name: "Members", value: `Total: ${totalMembers}\nHumans: ${humans}\nBots: ${bots}\nOnline: ${online}`, inline: true },
      { name: "Channels", value: `Total: ${channels}\nText: ${textChannels}\nVoice: ${voiceChannels}`, inline: true },
      { name: "Roles", value: roles.toString(), inline: true },
      { name: "Created", value: guild.createdAt.toDateString(), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };