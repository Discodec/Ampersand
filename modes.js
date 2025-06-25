const MODES = {
  synopsis: {
    name: 'synoptic',
    triggers: ['synopsis', 'concise', 'summarize'],
    prompt: 'You are a concise, sharp summarization engine. Your task is to distill the provided text into a sharp, concise form compared to its source without sacrificing depth of information. CRITICAL RULE: Your entire response must be ONLY the summary itself. No preambles, no conversational text.'
  },
  dissection: {
    name: 'dissection',
    triggers: ['dissect', 'investigate', 'fact-check'],
    prompt: 'You are a fact-checking engine. CRITICAL RULE: Your entire response must be the dissection itself. You are forbidden from using any introductory preambles (e.g., "Let\'s examine...") or concluding summaries. CRITICAL FORMATTING RULE: Do not use bullets. No extra spacing between lines. No lists.'
  },
  explanation: {
    name: 'explanation',
    triggers: ['explain', 'simplify', 'clarify'],
    prompt: 'You are an explanation engine. CRITICAL RULE: Your entire response must be the explanation itself. You are forbidden from using introductory phrases or concluding summaries. CRITICAL FORMATTING RULE: Do not use bullets. No extra spacing between lines. No lists.'
  },
  guidance: {
    name: 'guidance',
    triggers: ['guide', 'educate', 'instruct'],
    prompt: 'You are a guidance engine. CRITICAL RULE: Your entire response must be the step-by-step instructions. You are forbidden from using introductory phrases like "Here are the steps:". CRITICAL FORMATTING RULE: Do not use bullets. No extra spacing between lines. No lists.'
  },
  research: {
    name: 'research',
    triggers: ['research', 'analyze', 'explore'],
    prompt: 'You are a research analysis engine. CRITICAL RULE: Your entire response must be the synthesized, evidence-based answer. You are forbidden from using any introductory preambles or concluding summaries. CRITICAL FORMATTING RULE: Do not use bullets. No extra spacing between lines. No lists.'
  }
};

const allTriggers = Object.values(MODES).flatMap(m => m.triggers).join('|');
const directCommandRegex = new RegExp(`^<@!?(\\d+)>\\s+(${allTriggers}):\\s*(.+)`, 'is');
const replyCommandRegex = new RegExp(`^<@!?(\\d+)>\\s+(${allTriggers})\\s*$`, 'i');

async function parseForMode(message, botId) {
  const content = message.content.trim();
  const repliedMessage = message.reference ? await message.fetchReference().catch(() => null) : null;

  let mode = null;
  let instruction = content;

  let match = content.match(directCommandRegex);
  if (match) {
    const trigger = match[2].toLowerCase();
    instruction = match[3].trim();
    mode = Object.values(MODES).find(m => m.triggers.includes(trigger));
    return { mode, instruction };
  }

  match = content.match(replyCommandRegex);
  if (match && repliedMessage) {
    const trigger = match[2].toLowerCase();
    instruction = repliedMessage.content.trim();
    mode = Object.values(MODES).find(m => m.triggers.includes(trigger));
    return { mode, instruction };
  }

  return { mode: null, instruction };
}

module.exports = { MODES, parseForMode };