const { EmbedBuilder } = require("discord.js");
const ollama = require("./ollama");

const welcomeChannels = new Map();

function setWelcomeChannel(guildId, channelId) {
  welcomeChannels.set(guildId, channelId);
}

function getWelcomeChannel(guildId) {
  return welcomeChannels.get(guildId);
}

async function sendWelcome(member) {
  const channelId = welcomeChannels.get(member.guild.id);
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const running = await ollama.isRunning();
  let welcomeMsg = `Welcome to ${member.guild.name}, ${member.user.username}!`;

  try {
    const prompt = `Generate a short, fun welcome message for a new Discord member named "${member.user.username}" joining server "${member.guild.name}". Keep it under 2 sentences. Be friendly and welcoming.`;
    welcomeMsg = await ollama.generate(prompt);
  } catch {}

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Welcome, ${member.user.username}!`)
    .setDescription(welcomeMsg)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed] });
  } catch (e) {
    console.error("Welcome error:", e);
  }
}

module.exports = { setWelcomeChannel, getWelcomeChannel, sendWelcome };