const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a member")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to ban").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason")
  );

async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const reason = interaction.options.getString("reason") || "No reason provided";

  const member = await interaction.guild.members.fetch(user.id);

  if (!member) {
    return interaction.reply({ content: "User not found in server.", ephemeral: true });
  }

  if (!member.bannable) {
    return interaction.reply({ content: "Cannot ban this user.", ephemeral: true });
  }

  try {
    await member.ban({ reason });
    await interaction.reply(`Banned ${user.tag}. Reason: ${reason}`);
  } catch (error) {
    await interaction.reply({ content: "Error banning user.", ephemeral: true });
  }
}

module.exports = { data, execute };