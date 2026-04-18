const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription("Ask the AI anything")
  .addStringOption((option) =>
    option.setName("question").setDescription("Your question").setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("private").setDescription("Response in private DM")
  );

async function execute(interaction, { ollama, memory }) {
  const question = interaction.options.getString("question");
  const ephemeral = interaction.options.getBoolean("private") || false;

  const running = await ollama.isRunning();
  if (!running) {
    return interaction.reply({
      content: "Ollama is not running! Start your Ollama server first.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral });

  try {
    const userKey = `user_${interaction.user.id}`;
    const history = memory.getHistory(userKey);

    const systemPrompt = `You are DSbot, a helpful and friendly AI assistant in a Discord server. 
You help with questions, server management, coding, and creative tasks. 
Be concise but thorough. Use markdown formatting when helpful.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: question },
    ];

    const response = await ollama.chat(messages);
    memory.addMessage(userKey, "user", question);
    memory.addMessage(userKey, "assistant", response);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("AI Response")
      .setDescription(response.slice(0, 4096))
      .setFooter({ text: `Model: ${ollama.getModel()}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error in /ask:", error);
    await interaction.editReply("Error processing your request.");
  }
}

module.exports = { data, execute };