// tokenUtils.js
function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[\u2012\u2013\u2014\u2015]/g, ', ');
}

function countTokens(text) {
  if (typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).length;
}

function trimMessages(messages, maxTokens) {
  let totalTokens = 0;
  const trimmedMessages = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const tokens = countTokens(message.content);
    if (totalTokens + tokens > maxTokens) break;
    totalTokens += tokens;
    trimmedMessages.unshift(message);
  }
  return trimmedMessages;
}

module.exports = { sanitize, countTokens, trimMessages };