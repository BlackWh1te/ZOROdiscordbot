const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("manage-channel")
  .setDescription("Get channel management advice")
  .addStringOption((option) =>
    option.setName("action").setDescription("What you want to do").setRequired(true)
  )
  .addChannelOption((option) =>
    option.setName("channel").setDescription("The channel")
  )
  .addStringOption((option) =>
    option.setName("question").setDescription("Additional question")
  );

async function execute(interaction, { ollama }) {
  const action = interaction.options.getString("action");
  const channel = interaction.options.getChannel("channel");
  const question = interaction.options.getString("question");

  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({
      content: "Ollama is not running!",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const channelInfo = channel
    ? `Channel: ${channel.name} (${channel.type})`
    : "No specific channel selected";
  const prompt = `Discord channel management: ${action}. ${channelInfo}. ${question || ""}
Give specific, actionable advice including permissions and settings.`;

  try {
    const response = await ollama.generate(prompt);

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`Channel: ${channel?.name || "General"}`)
      .setDescription(response.slice(0, 4096))
      .setFooter({ text: `Model: ${ollama.getModel()}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in /manage-channel:", error);
    await interaction.editReply("Error managing channel.");
  }
}

module.exports = { data, execute };