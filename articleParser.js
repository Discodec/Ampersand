// articleParser.js
const axios = require('axios');
const { JSDOM, VirtualConsole } = require('jsdom'); // Correctly import VirtualConsole
const { Readability } = require('@mozilla/readability');
const logger = require('./logger');

function sanitizeJunkCode(text) {
    if (!text) return '';
    let cleanedText = text.replace(/\{[^{}]*\}/g, '');
    cleanedText = cleanedText.split('\n').filter(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('.') && !trimmed.startsWith('#') && !trimmed.endsWith(';') && !trimmed.endsWith('{');
    }).join('\n');
    return cleanedText.replace(/\s+/g, ' ').trim();
}

async function articleParser(url) {
  try {
    const resp = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    
    // THE FIX: Create and use a JSDOM VirtualConsole to suppress CSS errors.
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("error", (e) => {
        if (e.message.includes("Could not parse CSS stylesheet")) { return; }
        console.error("JSDOM Error:", e);
    });

    const doc = new JSDOM(resp.data, { url, virtualConsole });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    let content = (article && article.textContent) ? article.textContent : (doc.window.document.body.textContent || '');
    return sanitizeJunkCode(content);

  } catch (err) {
    logger.error(`Article parser error for ${url}:`, err);
    return '';
  }
}

module.exports = { articleParser };