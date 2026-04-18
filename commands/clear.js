const { SlashCommandBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Clear conversation memory")
  .addStringOption((option) =>
    option
      .setName("scope")
      .setDescription("What to clear")
      .addChoices(
        { name: "My conversation", value: "user" },
        { name: "This channel", value: "channel" },
        { name: "All conversations (admin)", value: "all" }
      )
  );

async function execute(interaction, { memory }) {
  const scope = interaction.options.getString("scope") || "user";

  if (scope === "all") {
    if (!interaction.memberPermissions.has("Administrator")) {
      return interaction.reply({
        content: "Only admins can clear all conversation history.",
        ephemeral: true,
      });
    }
    memory.clearHistory();
    await interaction.reply({
      content: "All conversation history cleared.",
      ephemeral: true,
    });
  } else if (scope === "channel") {
    memory.clearHistory(`channel_${interaction.channel.id}`);
    await interaction.reply({
      content: "Channel conversation history cleared.",
      ephemeral: true,
    });
  } else {
    memory.clearHistory(`user_${interaction.user.id}`);
    await interaction.reply({
      content: "Your conversation history cleared.",
      ephemeral: true,
    });
  }
}

module.exports = { data, execute };