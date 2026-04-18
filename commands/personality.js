const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const personality = require("../utils/personality");
const auto = require("../utils/auto");

const data = new SlashCommandBuilder()
  .setName("personality")
  .setDescription("Set bot personality")
  .addStringOption((option) =>
    option.setName("name").setDescription("Personality name")
      .addChoices(
        { name: "Default (Helpful)", value: "default" },
        { name: "Ninja", value: "ninja" },
        { name: "Pirate", value: "pirate" },
        { name: "Robot", value: "bot" },
        { name: "Wizard", value: "wizard" },
        { name: "Meme Lord", value: "meme" }
      )
      .setRequired(true)
  );

async function execute(interaction) {
  const name = interaction.options.getString("name");
  const p = personality.getPersonality(name);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Personality: ${p.name}`)
    .setDescription(p.description)
    .addFields(
      { name: "Greeting", value: p.greeting, inline: false },
      { name: "Traits", value: p.traits.join(", "), inline: false }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

module.exports = { data, execute };