export const LOCAL_STORY_CORPUS = Object.freeze({
  REGION_ENTERED: [
    (context) => ({ narration: `By dusk, the road had carried Eldric into ${title(context.region)}, where even the chimney smoke seemed to be keeping a secret.` }),
    { narration: 'The forest opened like a green curtain, and Millhaven waited beyond it.' },
  ],
  CAMPFIRE_REST: [
    (context) => ({ narration: context.chronicle.length ? `At the fire, the old voice gathered ${context.chronicle.length} remembered deeds into a single tale.` : 'The fire found no boast in Eldric, only a traveler not yet finished.', chronicle_entry: 'Eldric rested beneath Millhaven’s turning stars.' }),
  ],
  MAJOR_DECISION: [
    { narration: 'The river accepted the choice without judgment. Rivers are older than mercy.', rumors: [{ text: 'Some swear the black water spoke Eldric’s name.', truth: 'exaggerated', source_id: 'millhaven_tavern' }] },
  ],
  DEFAULT: [{ narration: 'The storyteller turns a weathered page, finding the road exactly where Eldric left it.' }],
});
function title(value) { return String(value).split(/[-_]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
