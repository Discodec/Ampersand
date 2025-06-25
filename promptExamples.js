// promptExamples.js
const EXAMPLES = {
  synoptic: [
    { role: 'user', content: 'The sun is a star, a hot ball of glowing gases at the heart of our solar system. Its gravity holds the solar system together, keeping everything from the biggest planets to the smallest particles of debris in its orbit.' },
    // CHANGE: The example assistant response is now more concise.
    { role: 'assistant', content: 'The sun is a central star whose gravity binds the solar system.' }
  ],
  dissection: [
    { role: 'user', content: 'The claim is that water has memory, which is the basis for homeopathy.' },
    { role: 'assistant', content: 'The concept of "water memory" is pseudoscience. It lacks any credible scientific evidence and contradicts fundamental principles of physics and chemistry. The molecular turnover in liquid water is extremely rapid, making it impossible for water to maintain stable, information-carrying structures.' }
  ],
  explanation: [
    { role: 'user', content: 'What is Occam\'s Razor?' },
    { role: 'assistant', content: 'Occam\'s Razor is a principle of problem-solving that states when presented with competing hypotheses about the same prediction, one should select the one that makes the fewest assumptions. It is not a law but a heuristic that prioritizes simplicity, suggesting that the simplest explanation is usually the most likely to be correct.' }
  ],
  guidance: [
    { role: 'user', content: 'How do I change a flat tire?' },
    {
      role: 'assistant',
      content: `1. Find a safe location and turn on your hazard lights.
2. Apply the parking brake and place wheel wedges behind the wheels on the opposite end.
3. Remove the hubcap and loosen the lug nuts.
4. Place the jack under the vehicle's frame and raise the vehicle until the flat tire is off the ground.
5. Unscrew the lug nuts completely and remove the flat tire.
6. Mount the spare tire and tighten the lug nuts by hand.
7. Lower the vehicle slightly, fully tighten the lug nuts with the wrench, then lower it completely.`
    }
  ],
  research: [
    { role: 'user', content: 'What was the significance of the printing press?' },
    { role: 'assistant', content: `The invention of the printing press by Johannes Gutenberg around 1440 was a pivotal event that marked the start of the Printing Revolution. Its primary significance was the mass dissemination of information. Before the press, books were hand-copied by scribes, a slow and expensive process that made them accessible only to the wealthy elite and clergy. The printing press allowed for the rapid, inexpensive production of texts, leading to a dramatic increase in literacy rates across Europe. This widespread access to knowledge fueled major social and political movements like the Protestant Reformation and accelerated the Scientific Revolution.` }
  ]
};

function getPromptExample(modeName) {
  return EXAMPLES[modeName] || null;
}

module.exports = { getPromptExample };