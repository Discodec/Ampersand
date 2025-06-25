// conversationMemory.js
const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.resolve(__dirname, 'memory');
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

const MAX_RAM_MESSAGES = 20;
const SUMMARY_INTERVAL = 50; // messages per summary

// In-memory store: channelId => [{role, content, timestamp}, ...]
const ramMemory = new Map();

// Persistent summaries file per channel
function getSummaryFile(channelId) {
  return path.join(MEMORY_DIR, `summary_${channelId}.txt`);
}

function loadSummary(channelId) {
  try {
    const file = getSummaryFile(channelId);
    if (fs.existsSync(file)) {
      return fs.readFileSync(file, 'utf-8');
    }
  } catch (e) {
    console.error(`Failed to load summary for ${channelId}`, e);
  }
  return '';
}

function saveSummary(channelId, summaryText) {
  try {
    fs.writeFileSync(getSummaryFile(channelId), summaryText, 'utf-8');
  } catch (e) {
    console.error(`Failed to save summary for ${channelId}`, e);
  }
}

function addMessage(channelId, message) {
  if (!ramMemory.has(channelId)) {
    ramMemory.set(channelId, []);
  }
  const messages = ramMemory.get(channelId);
  messages.push(message);
  // Keep last MAX_RAM_MESSAGES
  if (messages.length > MAX_RAM_MESSAGES) {
    messages.shift();
  }
  return messages.length;
}

function getRamMemory(channelId) {
  return ramMemory.get(channelId) || [];
}

module.exports = {
  addMessage,
  getRamMemory,
  loadSummary,
  saveSummary,
  SUMMARY_INTERVAL,
};