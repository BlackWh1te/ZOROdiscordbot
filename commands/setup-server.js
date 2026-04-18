const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("setup-server")
  .setDescription("Get AI server setup recommendations")
  .addStringOption((option) =>
    option.setName("type").setDescription("Server type").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("name").setDescription("Server name")
  );

async function execute(interaction, { ollama }) {
  const serverType = interaction.options.getString("type");
  const serverName = interaction.options.getString("name") || interaction.guild.name;

  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({
      content: "Ollama is not running!",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const prompt = `I'm setting up a Discord server called "${serverName}" for ${serverType} use.
Please provide a complete server setup recommendation including:
1. Category structure with channels (text and voice)
2. Role hierarchy with permissions
3. Channel topics and descriptions
4. Best practices for this type of server
Format the response in a clean, organized way using markdown.`;

  try {
    const response = await ollama.generate(prompt);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Server Setup: ${serverName}`)
      .setDescription(response.slice(0, 4096))
      .setFooter({ text: `Model: ${ollama.getModel()}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in /setup-server:", error);
    await interaction.editReply("Error generating server setup.");
  }
}

module.exports = { data, execute };