const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const reminder = require("../utils/reminder");

const data = new SlashCommandBuilder()
  .setName("remind")
  .setDescription("Set a reminder")
  .addStringOption((option) =>
    option.setName("message").setDescription("Reminder message").setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName("minutes").setDescription("Minutes from now").setRequired(true)
  );

async function execute(interaction) {
  const message = interaction.options.getString("message");
  const minutes = interaction.options.getInteger("minutes");

  const ms = minutes * 60 * 1000;
  const time = new Date(Date.now() + ms);
  const timeStr = time.toLocaleTimeString();

  const id = reminder.addReminder(interaction.user.id, ms, message, interaction.channel);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Reminder Set")
    .setDescription(`I'll remind you in ${minutes} minutes!\n**${message}**`)
    .setFooter({ text: `At ${timeStr}` });

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };