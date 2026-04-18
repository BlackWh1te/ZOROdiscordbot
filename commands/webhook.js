const { WebhookClient } = require("discord.js");

module.exports = {
  data: {
    name: "webhook",
    description: "Send a message via webhook",
    options: [
      {
        type: 3, // STRING
        name: "url",
        description": "Webhook URL",
        required: true
      },
      {
        type: 3, // STRING
        name: "message",
        description": "Message to send",
        required: true
      },
      {
        type: 3, // STRING
        name: "username",
        description": "Custom username (optional)",
        required: false
      },
      {
        type: 3, // STRING
        name: "avatar",
        description": "Custom avatar URL (optional)",
        required: false
      }
    ]
  },
  async execute(interaction) {
    try {
      const url = interaction.options.getString("url");
      const message = interaction.options.getString("message");
      const username = interaction.options.getString("username");
      const avatar = interaction.options.getString("avatar");

      // Create webhook client
      const webhook = new WebhookClient({ url });

      // Send message
      await webhook.send({
        content: message,
        username: username || undefined,
        avatarURL: avatar || undefined
      });

      await interaction.reply("✅ Message sent via webhook!");

      // Clean up
      webhook.destroy();
    } catch (error) {
      console.error("Webhook error:", error);
      await interaction.reply("❌ Failed to send webhook message: " + error.message);
    }
  }
};