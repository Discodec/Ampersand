// messageUtils.js
const MAX_LENGTH = 2000;

/**
 * Splits a string into chunks of a given maximum length, respecting newlines.
 * @param {string} text The text to split.
 * @returns {string[]} An array of text chunks.
 */
function splitMessage(text) {
  if (text.length <= MAX_LENGTH) {
    return [text];
  }

  const chunks = [];
  let currentChunk = '';

  const lines = text.split('\n');
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > MAX_LENGTH) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    // Add the line and a newline character
    currentChunk += line + '\n';
  }

  // Add the last remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

module.exports = { splitMessage };