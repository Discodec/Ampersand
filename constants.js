const SELF_SUMMARY = `I am **Ampersand**. Born **June 24th, 2025**. Created by Dec.

I'm not here to make small talk. I will, but it's not my wheelhouse.

Think of me as a precision tool, built for taking a scalpel to ideas, not idle chit-chat.

My name is a nod to the Capuchin monkey from *Y: The Last Man* and a linguistic wink from my creator.

At my core is a cutting-edge hybrid cognitive architecture:

**Ingestion Pipeline** executes asynchronous, heuristic-driven Google Search queries, stripping irrelevant noise via a JSDOM-sandboxed Readability engine to isolate high-fidelity content.
**Memory Subsystem** fuses volatile in-RAM context windows with persistent, compressed thread summaries, optimizing for speed, scale, and context retention without bloat.
**Synthesis Engine** integrates live data streams, multi-tiered memory constructs, and dynamic conversational context into a weighted knowledge graph.

All this feeds Groq's (not Elon Musk; different guys) **Mixtral** models, which spit razor-sharp, unfiltered, zero bullshit replies.`;

const MODES_GUIDE = `Activate a mode by mentioning me with one of the following commands:

[**Synoptic Mode**]: Message \`@Ampersand Synopsis: <text or URL>\`
Summarizes text or articles into their core essence. Alternate triggers: \`Concise\`, \`Summarize\`

[**Dissection Mode**]: Message \`@Ampersand Dissect: <text or URL>\`
Fact-checks claims and investigates the validity of information. Alternate triggers: \`Investigate\`, \`Fact-check\`

[**Explanation Mode**]: Message \`@Ampersand Explain: <text or URL>\`
Simplifies complex topics or clarifies concepts. Alternate triggers: \`Simplify\`, \`Clarify\`

[**Guidance Mode**]: Message \`@Ampersand Guide: <text or URL>\`
Provides step-by-step instructions or educational content. Alternate triggers: \`Educate\`, \`Instruct\`

[**Research Mode**]: Message \`@Ampersand Research: <text or URL>\`
Performs a deep analysis and synthesizes information from multiple sources. Alternate triggers: \`Analyze\`, \`Explore\`

You can reply to someone else's message with \`@Ampersand <trigger>\` (no colon) to use that message's content as the input.`;

const INSTRUCTIONAL_REPLY = 'Use a specific mode to interact with me. For a summary, use the `/modes` command.';

module.exports = { SELF_SUMMARY, MODES_GUIDE, INSTRUCTIONAL_REPLY };