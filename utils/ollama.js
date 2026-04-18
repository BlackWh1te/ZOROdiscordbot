const host = process.env.OLLAMA_HOST || "http://localhost:11434";
let currentModel = process.env.OLLAMA_MODEL || "llama3.2:latest";

async function isRunning() {
  try {
    const response = await fetch(`${host}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

async function listModels() {
  try {
    const response = await fetch(`${host}/api/tags`);
    const data = await response.json();
    return data.models || [];
  } catch {
    return [];
  }
}

async function chat(messages, options = {}) {
  const model = options.model || currentModel;

  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  const data = await response.json();
  return data.message?.content || "";
}

async function generate(prompt, options = {}) {
  const model = options.model || currentModel;

  const response = await fetch(`${host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  const data = await response.json();
  return data.response || "";
}

function setModel(model) {
  currentModel = model;
}

function getModel() {
  return currentModel;
}

module.exports = { isRunning, listModels, chat, generate, setModel, getModel };