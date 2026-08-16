export const BLACKWATER_QUEST = Object.freeze({ id: 'blackwater_oath', title: 'What Waits Beneath Blackwater', description: 'Discover why travelers vanish near the bridge, and decide what Millhaven is willing to owe the river.', objectives: [
  { type: 'TALK_TO', target: 'elara', text: 'Hear Elara’s account.' },
  { type: 'GO_TO', target: 'blackwater-road', text: 'Follow the road east.' },
  { type: 'FIND', target: 'wagon_marks', text: 'Examine the abandoned wagon.' },
  { type: 'EXPLORE', target: 'sunken-ruin', text: 'Search the Broken King’s watch.' },
  { type: 'COLLECT', target: 'river_key', text: 'Recover the River Key.' },
  { type: 'DEFEAT', target: 'thornhart', text: 'Defeat the ruin’s guardian.' },
  { type: 'CHOOSE', target: 'river_oath', text: 'Break the seal or renew the binding.' },
  { type: 'DEFEAT', target: 'drowned_oath', text: 'Survive what the river remembers.' },
] });
