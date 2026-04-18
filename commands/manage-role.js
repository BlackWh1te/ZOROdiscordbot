const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("manage-role")
  .setDescription("Get role management advice")
  .addStringOption((option) =>
    option.setName("action").setDescription("What you want to do").setRequired(true)
  )
  .addRoleOption((option) =>
    option.setName("role").setDescription("The role")
  )
  .addStringOption((option) =>
    option.setName("question").setDescription("Additional question")
  );

async function execute(interaction, { ollama }) {
  const action = interaction.options.getString("action");
  const role = interaction.options.getRole("role");
  const question = interaction.options.getString("question");

  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({
      content: "Ollama is not running!",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const roleInfo = role
    ? `Role: ${role.name} (color: ${role.hexColor})`
    : "No specific role selected";
  const prompt = `Discord role management: ${action}. ${roleInfo}. ${question || ""}
Give specific advice about permissions, colors, and hierarchy.`;

  try {
    const response = await ollama.generate(prompt);

    const embed = new EmbedBuilder()
      .setColor(role?.color || 0xfee75c)
      .setTitle(`Role: ${role?.name || "General"}`)
      .setDescription(response.slice(0, 4096))
      .setFooter({ text: `Model: ${ollama.getModel()}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in /manage-role:", error);
    await interaction.editReply("Error managing role.");
  }
}

module.exports = { data, execute };