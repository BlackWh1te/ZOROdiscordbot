const conversations = new Map();
const MAX_HISTORY = 50;

function getHistory(key) {
  if (!conversations.has(key)) {
    conversations.set(key, []);
  }
  return conversations.get(key);
}

function addMessage(key, role, content) {
  const history = getHistory(key);
  history.push({ role, content });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

function clearHistory(key) {
  if (key) {
    conversations.delete(key);
  } else {
    conversations.clear();
  }
}

function getConversation(key) {
  return getHistory(key);
}

function getAllKeys() {
  return Array.from(conversations.keys());
}

module.exports = { getHistory, addMessage, clearHistory, getConversation, getAllKeys };
