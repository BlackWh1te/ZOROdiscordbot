const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const auto = require("../utils/auto");

const data = new SlashCommandBuilder()
  .setName("auto")
  .setDescription("Set up auto-responders and triggers")
  .addStringOption((option) =>
    option.setName("action").setDescription("Action")
      .addChoices(
        { name: "Add Trigger", value: "add" },
        { name: "Remove Trigger", value: "remove" },
        { name: "List Triggers", value: "list" },
        { name: "Add Workflow", value: "workflow" },
        { name: "Test Workflow", value: "test" }
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("trigger").setDescription("Trigger phrase")
  )
  .addStringOption((option) =>
    option.setName("response").setDescription("Response")
  )
  .addStringOption((option) =>
    option.setName("type").setDescription("Match type")
      .addChoices(
        { name: "Exact", value: "exact" },
        { name: "Contains", value: "contains" },
        { name: "Starts With", value: "starts" }
      )
  );

async function execute(interaction) {
  const action = interaction.options.getString("action");
  const trigger = interaction.options.getString("trigger");
  const response = interaction.options.getString("response");
  const type = interaction.options.getString("type") || "contains";

  if (action === "list") {
    const autoData = auto.loadAuto();
    const triggers = Object.entries(autoData.triggers).map(([t, r]) => `${t} → ${r.response}`).join("\n") || "No triggers";
    return interaction.reply(`Active Triggers:\n${triggers}`);
  }

  if (action === "add" && trigger && response) {
    auto.addTrigger(trigger, response, { type });
    return interaction.reply(`Added trigger: "${trigger}" → "${response}"`);
  }

  if (action === "remove" && trigger) {
    auto.removeTrigger(trigger);
    return interaction.reply(`Removed trigger: ${trigger}`);
  }

  if (action === "workflow" && trigger) {
    auto.addWorkflow(trigger, [{ name: "step1", action: "respond" }]);
    return interaction.reply(`Workflow "${trigger}" created.`);
  }

  await interaction.reply("Use /auto list to see triggers.");
}

module.exports = { data, execute };