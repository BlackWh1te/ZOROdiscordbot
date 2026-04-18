const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a member")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to kick").setRequired(true)
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

  if (!member.kickable) {
    return interaction.reply({ content: "Cannot kick this user.", ephemeral: true });
  }

  try {
    await member.kick(reason);
    await interaction.reply(`Kicked ${user.tag}. Reason: ${reason}`);
  } catch (error) {
    await interaction.reply({ content: "Error kicking user.", ephemeral: true });
  }
}

module.exports = { data, execute };