// getResponse.js
const Groq = require('groq-sdk');
const { trimMessages } = require('./tokenUtils');
const { search } = require('./googleSearch');
const { articleParser } = require('./articleParser');
const logger = require('./logger');
const { groqKey } = require('./config');

const groq = new Groq({ apiKey: groqKey });
const MAX_TOKENS_FOR_MODEL = 32000;
const SEARCH_COOLDOWN_MS = 90 * 1000;
const lastSearchTimestamps = new Map();

const QUESTION_REGEX = /\?|^(what|who|when|where|why|how|is|do|does|can|will|should|explain|summarize|dissect|fact-check|guide|research)\b/i;
const PREFERRED_SOURCES = [
  'wikipedia.org', 'reuters.com', 'apnews.com', 'npr.org', 'pbs.org',
  'bbc.com', 'forbes.com', 'bloomberg.com', 'techcrunch.com', 'theverge.com',
  'arstechnica.com', 'webmd.com', 'mayoclinic.org', 'nih.gov', 'cdc.gov',
  'espn.com', 'theathletic.com', 'bleacherreport.com', 'cbssports.com',
];
const WEB_CONTENT_CHAR_LIMIT = 50000;

function isValidUrl(string) {
  try { new URL(string); return true; } catch { return false; }
}

async function generateChatResponseWithRetries(payload) {
  let attempts = 0;
  const maxAttempts = 4;
  let delay = 2000;
  while (attempts < maxAttempts) {
    try {
      const resp = await groq.chat.completions.create(payload);
      if (resp && resp.choices && resp.choices.length > 0 && resp.choices[0].message && resp.choices[0].message.content) {
        return resp.choices[0].message.content;
      }
      logger.warn("Groq API returned a response with no text content.", { response: resp });
      return '';
    } catch (err) {
      if (err.response && (err.response.status === 429 || err.response.status >= 500)) {
        attempts++;
        if (attempts >= maxAttempts) {
          logger.error(`Groq API request failed after ${maxAttempts} attempts.`, err);
          throw err;
        }
        logger.warn(`Groq API overloaded (status ${err.response.status}). Retrying in ${delay / 1000}s... (Attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        logger.error('Groq API error:', err);
        throw err;
      }
    }
  }
}

async function generateChatResponse(systemPrompt, memory, history) {
  let finalSystemPromptContent = systemPrompt;
  if (memory && memory.length) {
    const memoryContent = `Memory:\n${memory.join('\n')}`;
    finalSystemPromptContent = `${finalSystemPromptContent}\n\n${memoryContent}`;
  }

  const messages = [];
  messages.push({ role: 'system', content: finalSystemPromptContent });

  history.forEach(msg => {
    if (msg.role !== 'system' || msg.content !== systemPrompt) {
      messages.push(msg);
    }
  });

  const trimmedConversation = trimMessages(messages, MAX_TOKENS_FOR_MODEL);

  const payload = {
    model: 'llama3-70b-8192',
    messages: trimmedConversation,
    max_tokens: 2048,
  };
  return generateChatResponseWithRetries(payload);
}

function selectBestResultsHeuristically(candidates, query, numToReturn = 1) {
  const queryWords = query.toLowerCase().split(/\s+/).slice(0, 5);
  const scoredCandidates = candidates.map(candidate => {
    let score = 0;
    const lowerTitle = candidate.title.toLowerCase();
    const lowerSnippet = candidate.snippet.toLowerCase();

    if (PREFERRED_SOURCES.some(source => candidate.link.includes(source))) score += 20;
    if (candidate.link.includes('.gov')) score += 5;
    if (candidate.link.includes('.edu')) score += 4;
    if (candidate.link.includes('.org')) score += 2;

    queryWords.forEach(word => { if (lowerTitle.includes(word)) score += 2; });
    queryWords.forEach(word => { if (lowerSnippet.includes(word)) score++; });

    return { ...candidate, score };
  });
  scoredCandidates.sort((a, b) => b.score - a.score);
  logger.info(`Heuristically scored ${candidates.length} candidates. Top source: ${scoredCandidates[0]?.link} (Score: ${scoredCandidates[0]?.score || 'N/A'})`);
  return scoredCandidates;
}

async function getResponse({ systemPrompt, memory, history, channelId, forceSearch = false, modeName = null, searchQuery = '' }) {
  const now = Date.now();
  const lastSearch = lastSearchTimestamps.get(channelId) || 0;
  const onCooldown = now - lastSearch < SEARCH_COOLDOWN_MS;

  const isAQuestion = QUESTION_REGEX.test(searchQuery);
  const shouldSearch = forceSearch || (isAQuestion && !onCooldown);

  if (shouldSearch && searchQuery) {
    lastSearchTimestamps.set(channelId, now);
    const searchCandidates = await search(searchQuery);

    if (searchCandidates.length > 0) {
      const numToSelect = modeName === 'research' ? 3 : 1;
      const bestResults = selectBestResultsHeuristically(searchCandidates, searchQuery);

      let allParsedText = [];
      let successfulSources = [];
      for (const candidate of bestResults) {
        if (allParsedText.length >= numToSelect) break;
        const text = await articleParser(candidate.link);
        if (text) {
          allParsedText.push(text);
          successfulSources.push(candidate.link);
          logger.info(`Successfully parsed content from: ${candidate.link}`);
        } else {
          logger.warn(`Failed to parse content from: ${candidate.link}`);
        }
      }

      if (allParsedText.length > 0) {
        const combinedText = allParsedText.join('\n\n---\n\n').slice(0, WEB_CONTENT_CHAR_LIMIT);
        const freshInfo = `The following is context from web search(es) (sources: ${successfulSources.join(', ')}):\n${combinedText}`;
        logger.info(`Injecting fresh info (length: ${combinedText.length}) from ${successfulSources.length} source(s).`);

        memory = [...(memory || []), freshInfo];
      } else {
        logger.warn(`All candidate URLs failed to yield parsable content.`);
        memory = [...(memory || []), `[System Note: A web search for "${searchQuery}" yielded no usable results after heuristic analysis.]`];
      }
    } else {
      logger.warn(`Search for "${searchQuery}" yielded no viable candidates after filtering.`);
      memory = [...(memory || []), `[System Note: A web search for "${searchQuery}" yielded no usable results.]`];
    }
  } else if (isAQuestion && onCooldown) {
    logger.info(`Search for question "${searchQuery}" skipped due to active cooldown.`);
  }

  return generateChatResponse(systemPrompt, memory, history);
}

module.exports = { getResponse };
