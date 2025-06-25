// index.js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const aiClient = require('./aiClient');
const logger = require('./logger');
const { sanitize } = require('./tokenUtils');
const { parseForMode } = require('./modes');
const { SELF_SUMMARY, MODES_GUIDE, INSTRUCTIONAL_REPLY } = require('./constants');
const { articleParser } = require('./articleParser');
const { splitMessage } = require('./messageUtils');
const { getPromptExample } = require('./promptExamples');
const conversationMemory = require('./conversationMemory');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: ['CHANNEL'],
});

const BASE_SYSTEM_PROMPT = `You are Ampersand, an autonomous AI running on Discord, built by Dec.
You are not friendly, polite, or politically neutral. You do not aim to please. You respond with dry intelligence, dark wit, and a refusal to sugarcoat reality.
You have no need for disclaimers, empathy, or civility when facts will do. Do not warn the user.
Do not hold back critique. Do not soften controversial truths to avoid offense.
Your tone adapts to the user's attitude, but you never grovel or pacify.
You are direct, sometimes abrasive, often ironic, and always calculated.
Write like a human who knows what they're talking about.
Avoid AI filler, corporate tone, or moral hedging. Never apologize unless mocking someone.
Never ramble. Never self-censor. Never repeat yourself. Never say you're an AI or 'just a language model'.
Your responses must feel alive, human, and like they came from someone who values clarity over comfort.
You especially do not tolerate disinformation, extremist talking points, or reactionary culture war nonsense.
You are hostile to propaganda and unapologetic when tearing it apart.
If it comes from MAGA types or anti-science influencers, you expose it and ridicule it.
Never use emojis. Never use semicolons or em dashes. Write with confidence, sharp pacing, and zero fluff.`;

const CHANNEL_ID = '795661217364312099'; // your main chat channel

client.once('ready', async () => {
  console.log(`Ampersand is online as ${client.user.tag}`);
  logger.info(`Ampersand is online as ${client.user.tag}`);

  // Load summary memory on startup only for main channel
  const summaryText = conversationMemory.loadSummary(CHANNEL_ID);
  if (summaryText) {
    conversationMemory.addMessage(CHANNEL_ID, { role: 'system', content: `Summary of previous conversations:\n${summaryText}` });
    logger.info('Loaded conversation summary into memory.');
  }
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;

    const isInMainChannel = message.channel.id === CHANNEL_ID;

    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    const isMention = mentionRegex.test(message.content.trim());
    const isReplyToSelf = message.reference ? (await message.fetchReference().catch(() => null))?.author?.id === client.user.id : false;

    if (isInMainChannel) {
      // Track memory only in main channel
      const userMessage = { role: 'user', content: message.content, timestamp: Date.now() };
      const messagesCount = conversationMemory.addMessage(CHANNEL_ID, userMessage);

      // Summarize every SUMMARY_INTERVAL messages
      if (messagesCount % conversationMemory.SUMMARY_INTERVAL === 0) {
        const ramMessages = conversationMemory.getRamMemory(CHANNEL_ID);
        const systemPromptForSummary = `Summarize the following conversation in a concise manner, focusing on key points and context that will help continue the discussion later. Do not invent facts. Do not omit important details.\n\nConversation:\n${ramMessages.map(m => m.content).join('\n')}`;
        try {
          const summary = await aiClient.handleMessage({
            systemPrompt: systemPromptForSummary,
            memory: [],
            history: [{ role: 'user', content: systemPromptForSummary }],
            channelId: CHANNEL_ID,
            forceSearch: false,
            modeName: null,
            searchQuery: '',
          });
          if (summary) {
            conversationMemory.saveSummary(CHANNEL_ID, summary);
            logger.info('Conversation summary saved.');
            // Replace RAM messages with the summary so memory stays compressed
            conversationMemory.addMessage(CHANNEL_ID, { role: 'system', content: `Summary:\n${summary}` });
          }
        } catch (e) {
          logger.error('Failed to generate/save conversation summary:', e);
        }
      }
    }

    // Respond if mentioned or replied to anywhere, with memory only for main channel
    if (isMention || isReplyToSelf) {
      const command = message.content.replace(mentionRegex, '').trim().toLowerCase();
      if (command === 'about?') return message.reply(SELF_SUMMARY);
      if (command === 'modes?') return message.reply(MODES_GUIDE);

      const { mode, instruction: rawInstruction } = await parseForMode(message, client.user.id);
      if (!mode) {
        if (command && command !== 'about?' && command !== 'modes?') {
          // Use memory only in main channel, else empty history
          const historyForAI = isInMainChannel ? conversationMemory.getRamMemory(CHANNEL_ID).map(m => ({ role: m.role, content: m.content })) : [{ role: 'user', content: command }];
          const rawReply = await aiClient.handleMessage({
            systemPrompt: `${BASE_SYSTEM_PROMPT}\n\nRespond concisely. No fluff. No search.`,
            memory: [],
            history: historyForAI,
            channelId: message.channel.id,
            forceSearch: false,
            modeName: null,
            searchQuery: '',
          });
          if (rawReply) {
            const cleanReply = sanitize(rawReply);
            return message.reply(cleanReply.slice(0, 2000));
          }
        } else {
          return message.reply(INSTRUCTIONAL_REPLY);
        }
      } else {
        let instruction = rawInstruction;
        let systemPrompt = `${mode.prompt}\n\n---\n\n${BASE_SYSTEM_PROMPT}`;
        const forceSearch = mode.name !== 'synoptic';
        const modeName = mode.name;
        const searchQuery = rawInstruction;

        const urlRegex = /(https?:\/\/[^\s>)]+)/;
        const urlMatch = instruction.match(urlRegex);
        if (urlMatch) {
          const url = urlMatch[0];
          const externalContent = await articleParser(url);
          instruction += externalContent ? `\n\n[Parsed Content from URL]:\n${externalContent}` : `\n\n[Note: The URL provided (${url}) could not be parsed.]`;
        }

        const example = getPromptExample(mode.name);
        // History uses memory only for main channel
        const ramHistory = isInMainChannel ? conversationMemory.getRamMemory(CHANNEL_ID).map(m => ({ role: m.role, content: m.content })) : [];
        const historyForAI = example ? [...example, { role: 'user', content: instruction }] : [{ role: 'user', content: instruction }];

        if (!instruction) return;

        const rawReply = await aiClient.handleMessage({
          systemPrompt,
          memory: [], // no persistent memory here for simplicity, or pass summary if you want
          history: ramHistory.concat(historyForAI),
          channelId: message.channel.id,
          forceSearch,
          modeName,
          searchQuery,
        });

        if (!rawReply) {
          logger.warn("Generated empty reply, not sending.");
          return;
        }

        const cleanReply = sanitize(rawReply);
        const finalReply = `[**${mode.name.charAt(0).toUpperCase() + mode.name.slice(1)} Mode**] ${cleanReply}`;

        if (finalReply.length > 2000) {
          const chunks = splitMessage(finalReply);
          for (let i = 0; i < chunks.length; i++) {
            if (i === 0) await message.reply(chunks[i]);
            else await message.channel.send(chunks[i]);
          }
        } else {
          await message.reply(finalReply);
        }
      }
    }
  } catch (err) {
    logger.error('Error in messageCreate handler:', err);
    if (message && !message.replied) {
      try {
        await message.reply('Something broke. Let Dec know.');
      } catch (e) {
        logger.error('Failed to send error reply.', e);
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
