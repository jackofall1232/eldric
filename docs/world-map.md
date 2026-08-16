# The world map — ten chapters

Chapter one (Millhaven and Blackwater) ships. This is the blueprint for the nine that follow: one
continuous world map, revealed in layers, where each chapter is roughly the size of the whole
current game and each one hands the player a verb that reaches backwards into every region they
have already walked.

**This is a design document, not a backlog.** The tasks live in `l00prite/.l00prite/todos.md`.

---

## 1. The rule that makes it one world

Ten chapters played back to back is a corridor. What makes it a *map* is that every chapter's
reward is a **traversal verb**, and every traversal verb retro-opens content in the chapters
behind it.

> The Ferryman's Token, earned in chapter two, turns every river on the map into a road — including
> the Blackwater you crossed by bridge in chapter one, and the flooded eastern fields you may have
> drowned yourself.

That is the whole architecture. Each region is authored twice over: once for the player passing
through it on the critical path, and once for the player who comes back three chapters later able
to reach the far bank. Content behind a verb is cheap — it is a gate flag on an existing region —
and it is what turns ten short games into one large world.

**Rules for the verbs:**

- One verb per chapter. Never two, never zero.
- Every verb must retro-open something in at least **two** earlier chapters. If it doesn't, it is
  a key, not a verb, and it belongs inside its own chapter instead.
- No verb may be required to *finish* an earlier chapter. Chapters stay completable in order; the
  retro-content is depth, never a lock on the critical path.
- The player never loses a verb. The map only ever grows.

## 2. The through-line

The Broken King bound this land with oaths — real, binding, enforceable things — and then broke.
The oaths outlived him and no one alive remembers how to release them.

Chapter one is the smallest possible version of that story: one oath, one man who paid for it, and
a player who has to decide whether keeping a promise is worth what the promise costs. Every
chapter after it goes one step further up the chain — who made the oath, who enforced it, who
profited — until chapter ten asks whether the whole system should exist. The player's answer in
chapter one is quoted back to them in chapter eight by someone using it as evidence.

**The escalation:** a village → a county → a faith → a court → the machine underneath it all.

## 3. Scale — what "one chapter" means

Chapter one is the unit. Every chapter should measure roughly this, and a chapter that measures
double should be split:

| Measure | Chapter one ships | Per-chapter budget |
|---|---|---|
| World bounds | 1280 × 800 | 1200–1600 on the long axis |
| Named zones | 6 | 5–7 |
| Interactables | 23 | 20–28 |
| NPCs with written dialogue | 3 + travelers | 3–5 |
| Enterable interiors | 4 | 3–5 |
| Enemy kinds (new to this chapter) | 8 | 2–3 new + returning |
| Mini-boss / boss | 1 / 1 | 1 / 1 |
| Environmental puzzle | 1 (the river seal) | 1–2 |
| Decision with no clean answer | 1 | 1 |
| Play time | 15–30 min | 15–30 min |

Ten chapters at that budget is a 3–5 hour game before any retro-content, and roughly double with
it.

## 4. The chapters

Each entry: where it is, what gets the player in, the question it opens with, the truth
underneath, what it costs, what the player must decide, and **what it unlocks — forward and
backward**.

---

### Chapter 1 — Millhaven & Blackwater · *shipped*

**Region.** The village, Whisperwood, Blackwater Road, the bridge, the Sunken Ruin, the Gloam Cave.
**Hook.** Travelers are being attacked at the bridge. Rowan says beast; Elara says her brother.
**Truth.** Corven Vale is bound under the river by an oath older than the village.
**Boss.** The Drowned Oath. **Decision.** Break the seal (flood the fields) or renew it (leave a
man bound).
**Unlocks → The River Key** and the Chronicle itself.
**Retro-opens.** Oath-iron locks — the Millhaven cellar, and every oath-iron door in chapters 2–4.

---

### Chapter 2 — Fenmarch, the drowned road

**Region.** Downstream. Flood-wrecked farmland and a half-sunk toll road, a ferry hamlet on
stilts, a fishing weir, a barrow field the water has opened up.
**Gate.** Follow the Blackwater downstream from chapter one.
**Opening state depends on chapter one:** released → the fields are under water and Fenmarch is
drowning; bound → the river has gone unnaturally low and Fenmarch is dying of thirst. Same region,
two skins, one set of geometry.
**Hook.** The ferryman will not cross, and will not say why.
**Truth.** The ferry itself is an oath — someone's grandfather swore the crossing would never fail,
and the family has been paying for it in sons ever since.
**New enemies.** Bog-drowned (grapple and drag toward water), reed-stalkers (ambush from cover).
**Mini-boss.** The Weir Warden. **Boss.** The Ferryman's Oath — a boss fought across moving water.
**Decision.** Take the oath onto yourself to free the family, or let the last son carry it.
**Unlocks → The Ferryman's Token.** Deep water becomes traversable: punt, ford, and swim.
**Retro-opens.** Ch.1: the far bank of the Blackwater, the river cave under the bridge, the
drowned eastern fields. Ch.3+: every river, weir and flooded cut on the map is now a road.

---

### Chapter 3 — Ashfoot Wood

**Region.** The old-growth forest that feeds Millhaven's hearths. Charcoal camps, a burnt clearing
that will not regrow, a woodcutters' guildhall, a lightless hollow.
**Gate.** North out of Whisperwood, or by river with the Token.
**Hook.** The charcoal burners are cutting a stand of trees nobody will name.
**Truth.** The wood is a boundary marker. Cutting it is how the oaths are being quietly unmade —
and the guild is being paid to do it by someone in chapter eight.
**New enemies.** Ashwalkers (leave burning ground behind them), the guild's hired blades (fight in
coordinated pairs — the first enemies with real group behaviour).
**Mini-boss.** The Charcoal Master. **Boss.** The Green Hollow — a boss fought in total darkness,
where the Brand is both your light and your only weapon.
**Decision.** Burn the stand yourself to deny it to them, or protect it and let Millhaven freeze.
**Unlocks → The Warden's Brand.** Carried flame: darkness stops being a wall.
**Retro-opens.** Ch.1: the unlit depths of the Gloam Cave and the Sunken Ruin's lower floor.
Ch.2: the barrow interiors. Ch.4+: night becomes a playable time of day everywhere, with its own
encounters.

---

### Chapter 4 — The Broken King's Watch

**Region.** The ruin from chapter one, opened up into a full region: the watchtower proper, the
collapsed hall, the archive, the oath-vault beneath it.
**Gate.** The Brand — the lower floor was always there and always dark.
**Hook.** The reliquary you looted in chapter one was one of hundreds, and the rest are still here.
**Truth.** This was the office that *wrote* the oaths. The archive holds the ledger — including,
if the player looks, the entry for Corven Vale, in a hand that is still writing.
**New enemies.** Oath-knights (the armored knight, escalated — they revive unless their oath-mark
is broken first), archive-wraiths.
**Mini-boss.** The Last Clerk. **Boss.** The Warden of the Vault.
**Decision.** Burn the ledger — freeing everyone, erasing every record of who was owed what — or
keep it and become the only person alive who can read it.
**Unlocks → The Oathglass.** Oath-marks become visible: bindings, sealed doors, and the true
history of an object or a person on inspection.
**Retro-opens.** This is the big one. Marks appear in **every** region already visited — the saint
in Whisperwood, the Millhaven smithy's chains, the ferry, the burnt stand. Each is a small authored
truth. It also makes chapter one's NPCs re-readable: look at Rowan through the glass.

---

### Chapter 5 — Greyhollow

**Region.** A debtors' town in a quarry pit, built in tiers. Company store, debt-court, the pit
floor, a smugglers' run.
**Gate.** The road east, past a gate that reads your Chronicle aloud.
**Hook.** The town is entirely populated by people paying off oaths they inherited.
**Truth.** Debt here is oath-backed, which means it is enforceable by something that is not a
person. The reputation you built in chapters 1–4 decides who will deal with you — this is the
chapter where Infamy has teeth.
**New enemies.** Collectors (scale to your Infamy), pit-bosses.
**Mini-boss.** The Company Factor. **Boss.** The Assessor — reads your Chronicle and fights the
version of you it finds.
**Decision.** Break the debt-court (the town starves without the company) or take over the ledger
yourself.
**Unlocks → The Writ of Passage.** Faction roads, gate towns and guarded bridges open.
**Retro-opens.** Ch.2 and 3: the toll road and the guild hall have doors that were always shut.
Ch.6+: fast travel along the faction road network, which is also the map's spine.

---

### Chapter 6 — The Drowned Chapel & the Saltmarsh

**Region.** Where the Blackwater meets the sea. Tidal flats, a pilgrim road, a chapel that is
underwater at high tide and walkable at low — the map changes with the clock.
**Gate.** The Writ, and the Token to reach it.
**Hook.** The weathered saint in Whisperwood pointed here. She has a name, and it is on the
chapel wall.
**Truth.** The order in this chapel invented the oath-rite. They meant it as a mercy — a way to
hold a promise when no law could — and it worked exactly as designed.
**New enemies.** Tide-penitents, the choir (attack in harmony; the pattern is audible).
**Mini-boss.** The Bell-Keeper. **Boss.** The Abbess Who Would Not Drown — a two-phase fight
across a tide change.
**Decision.** Restore the rite (oaths keep working, cleanly, forever) or end the order's line
(nobody can make a new oath, and nobody can release an old one).
**Unlocks → The Litany.** Speak a minor oath undone.
**Retro-opens.** Every oath-sealed door the Oathglass revealed in chapters 1–5 can now be opened —
roughly a chapter's worth of content, unlocked in a single moment. This pairing (ch.4 sees, ch.6
opens) is the map's centrepiece and must be authored as one arc.

---

### Chapter 7 — Coldreach Pass

**Region.** The mountain road north. A vertical region — switchbacks, a rope bridge, an avalanche
field, a shrine above the cloud line.
**Gate.** The Litany opens the pass gate.
**Hook.** The court sends its exiles over this pass, and none of them arrive.
**Truth.** The pass is a disposal. The weather is not weather.
**New enemies.** Whiteout-stalkers (visible only when they attack), the frozen assize.
**Mini-boss.** The Toll-Ghost. **Boss.** The Blizzard Oath — an arena where visibility is the
mechanic.
**Decision.** Break the weather-oath (the pass opens; so does an invasion route) or leave it and
keep the kingdom sealed.
**Unlocks → The Stormcloak.** Killing weather becomes survivable.
**Retro-opens.** Ch.2's storm-flooded marsh, ch.3's night-frost zones, ch.6's high tide — exposed
areas across the map become enterable, and the existing weather system finally has stakes.

---

### Chapter 8 — The Iron Assize

**Region.** The court in exile: a fortified assize town, the record house, the barracks, the
judges' road.
**Gate.** Over Coldreach with the Stormcloak.
**Hook.** You are summoned, not invited.
**Truth.** The people running the kingdom know the oaths are failing and are strip-mining them for
what is left — the ch.3 guild payments trace here.
**This is the Chronicle chapter.** Your record is read back to you as evidence. Every decision
from chapters 1–7 is quoted, by name, by someone using it against you or for you. Nothing new is
generated: this is the payoff for the Chronicle having been honest all along.
**New enemies.** Assize marshals, the King's own (mirror the player's moveset).
**Mini-boss.** The Lord Justice. **Boss.** The Iron Verdict.
**Decision.** Take the seal by law (become part of it) or by force (become its enemy).
**Unlocks → The King's Seal.** Authority: royal doors, and a map-wide shift in how every faction
treats you.
**Retro-opens.** Sealed royal doors in chapters 1, 4, 5 and 6, and a second pass of dialogue for
every named NPC in the game.

---

### Chapter 9 — The Undercourt

**Region.** Beneath the capital. The oath-engine: a machine of chains, ledgers and bound things,
built in galleries that descend.
**Gate.** The King's Seal.
**Hook.** The oaths are not magic. Something is *enforcing* them, and it is down here.
**Truth.** The engine is bound people. It always was. Corven was a component.
**New enemies.** The bound (former named NPCs, if the player let them be taken), engine-wardens.
**Mini-boss.** The First Bound. **Boss.** The Engine's Voice.
**Decision.** Free the bound (the engine stops; every oath in the world fails at once, including
the good ones) or keep it running and choose who stays in it.
**Unlocks → The Unmaking Key.** Break a *major* oath — including your own.
**Retro-opens.** Every major decision the player made in chapters 1–8 becomes reversible, at a
cost. The chapter-one choice can finally be undone; doing so is its own small chapter of
consequence. This is the deepest thing in the game and it must be authored last.

---

### Chapter 10 — The Broken King

**Region.** The throne, and what is left of the man. Small, dense, and quiet — deliberately the
least combat-heavy region in the game.
**Gate.** The Unmaking Key.
**Hook.** He is still alive. He has been waiting for someone who could reach him.
**Truth.** He broke because he swore an oath he could not keep, and the oath is still holding him
to it. He cannot die and cannot stop.
**Boss.** The Broken King — three phases, each one a different one of his oaths.
**Decision — the ending.** Three ways, and the game does not rank them:
- **Restore** — swear the oath he could not keep, and take his place.
- **Unmake** — end every oath in the world, including the ones holding it together.
- **Inherit** — take the crown and the engine both, and run it better than he did.
**Unlocks → the New Chronicle.** A post-game layer where all ten regions reflect all ten
decisions, the surviving NPCs have final words, and the Chronicle is readable as a finished book.

---

## 5. Build order — the layers

Do **not** build chapter two to completion, then chapter three. Build the map in horizontal
layers, so that the game is playable end to end at every stage and each layer proves the systems
the next one needs.

**Layer 0 — systems the map needs before any of it (do this first).**
- Region streaming and a world graph: regions load and unload, the map is bigger than memory.
- The verb/gate system: a traversal verb is a flag, gates query it, and content can be authored
  behind one.
- Retro-content authoring: a region declares what it exposes at each verb, so chapter two's author
  can add to chapter one without editing chapter one.
- Chapter-boundary save/Chronicle carry-over, and a chapter-select for testing.
- Region-scoped music beds and a cross-fade, now that a scored bed exists.

**Layer 1 — the skeleton.** All ten regions blocked out at final size with real geometry, zone
names, gates and connections, and nothing else. Walkable end to end in an hour. This is where the
map's shape is proved or thrown away — before any art or writing is spent on it.

**Layer 2 — the spine.** Per chapter: critical path, one mini-boss, one boss, the decision, the
verb. No side content, no retro-content. The game is completable, ugly, and correct.

**Layer 3 — the depth pass.** Retro-content for every verb, region by region, oldest first. This is
the layer that makes it a world, and it is the one most likely to be cut under pressure — protect
it.

**Layer 4 — the art and audio pass.** Per region, in ship order.

**Layer 5 — the Chronicle payoff.** Chapter eight's evidence scene and chapter ten's New Chronicle
can only be written once every decision above them is final.

## 6. Non-negotiables carried forward

Everything in `l00prite/CLAUDE.md` still holds for every chapter. Three are worth restating because
they are the ones a ten-chapter scope will strain:

1. **Playable with AI disabled.** Ten chapters of authored content, not ten chapters of prompts.
   The storyteller decorates; it never carries a chapter.
2. **The engine never learns about Eldric.** Regions are content; the verb/gate system is engine.
3. **Every chapter is a vertical slice.** If chapter six is not shippable on its own, it is not
   done — and the game must be a satisfying stopping point at the end of *every* chapter, not just
   the tenth.
