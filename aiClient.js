// aiClient.js
const Groq = require('groq-sdk');
const { groqKey } = require('./config');
const logger = require('./logger');

const groq = new Groq({ apiKey: groqKey });

async function handleMessage({ systemPrompt, history, forceSearch = false, modeName = null, searchQuery = '', channelId = null }) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    const payload = {
      model: 'llama3-70b-8192',
      messages,
      max_tokens: 2048,
    };

    const resp = await groq.chat.completions.create(payload);
    if (resp.choices && resp.choices.length > 0) {
      return resp.choices[0].message.content;
    }
  } catch (err) {
    logger.error('Groq API error:', err);
    throw err;
  }
  return null;
}

module.exports = { handleMessage };
