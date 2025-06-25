// googleSearch.js
const axios = require('axios');
const logger = require('./logger');

const BANNED_DOMAINS = [
    'youtube.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'reddit.com', 'tiktok.com',
    'pinterest.com', 'linkedin.com', 'tumblr.com', 'imgur.com', 'quora.com', 'stackexchange.com', 'stackoverflow.com',
    'answers.yahoo.com', 'ask.fm', 'proboards.com', 'freeforums.net', 'amazon.com', 'ebay.com', 'walmart.com',
    'etsy.com', 'aliexpress.com', 'bestbuy.com', 'target.com', 'fandom.com', 'wattpad.com', 'archiveofourown.org',
    'breitbart.com', 'infowars.com', 'thegatewaypundit.com', 'dailycaller.com', 'dailywire.com', 'rt.com',
    'sputniknews.com', 'theblaze.com', 'medium.com', 'blogspot.com', 'substack.com', 'wiktionary.org',
    'dictionary.com', 'thesaurus.com', 'merriam-webster.com',
    'xml'
];

async function search(query, numCandidates = 10) {
  try {
    const resp = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: query,
        num: numCandidates,
      },
    });

    if (!resp.data.items || resp.data.items.length === 0) {
      return [];
    }

    const results = resp.data.items
      .filter(item => item.link && item.title && item.snippet)
      .map(item => ({ link: item.link, title: item.title, snippet: item.snippet }))
      .filter(item => !BANNED_DOMAINS.some(bannedDomain => item.link.includes(bannedDomain)));

    logger.info(`Google Search found ${resp.data.items.length} raw results, filtered down to ${results.length} viable candidates.`);
    return results;

  } catch (err) {
    logger.error('Google Search API error:', err);
    if (err.response) {
      logger.error('Google Search API response data:', err.response.data);
    }
    return [];
  }
}

module.exports = { search };