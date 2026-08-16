# Audio direction

Three buses, one scored bed, and a game that is complete in silence.

## Buses

`music`, `sfx`, `ambience`, each with its own level, all sitting under a master level and a mute
switch (`packages/engine/src/audio/mixer.js`). Mute is a separate flag rather than "master at
zero" so unmuting restores the level the player chose instead of guessing one. Every level change
is pushed to the backend's per-bus gain nodes and broadcast to anything carrying its own gain —
today that is the streamed soundtrack.

## The music bed

`assets/audio/eldric-background.mp3` (~10 min, looped) is the soundtrack. It plays through a media
element rather than a decoded WebAudio buffer, deliberately:

- it is minutes long and must start without waiting for a full download;
- routing a cross-origin file through an `AudioContext` needs CORS headers a host site may not
  send, and element volume needs none.

The cost is that the bed cannot carry WebAudio effects, which it does not need. While the bed
holds, `MusicDirector` stands the authored per-region chords down — one piece of music, not two —
but still records region state so a later cross-fade layer has it.

Muting **pauses** the stream rather than zeroing it: a silent stream still costs a mobile radio
and a decode.

## Effects

Everything else is procedural WebAudio synthesis (`backends/webaudio-backend.js`): short
oscillator-plus-envelope cues for swords, doors, footsteps, water, fire, treasure, birds, rain and
magic. No sample files, no loading, no failure mode beyond silence.

## Choosing the soundtrack

| `musicUrl` | Result |
|---|---|
| unset | the bundled score under `assetBase` |
| an http(s), protocol-relative, or root/relative path | that file |
| `none` | no bed; the authored per-region chords play instead |

In WordPress this is the shortcode's `music` attribute: `[living_chronicle music="none"]`. It
arrives from post content, so it is validated as caller input — a media element would otherwise
accept a `javascript:` or `data:` URL (`resolveMusicUrl` in `packages/game/src/boot/config.js`,
`LC_Shortcode::music_url`).

## Failure is not an error state

Autoplay refusal, a 404, an unsupported codec and a missing `AudioContext` all resolve the same
way: the bed reports that it did not start and the authored chords take over. A backend that
throws on `init()` is replaced with the null backend. Nothing in the audio stack can block play.

## Player controls

Mute and one slider per bus live in the `?` help panel (`packages/game/src/ui/audio-controls.js`)
as real DOM controls, so they are keyboard-operable, screen-reader labelled and draggable on
touch without any of that being reimplemented on canvas. `M` mutes from anywhere except a focused
text field. Levels persist to `localStorage` under `<saveKey>.audio` — beside the save, not
inside it, because they belong to this browser rather than to the adventure and must survive a
deleted save.

## Still to build

Cross-fades between region beds, a combat sting layered over the bed, ducking the bed under
dialogue, and per-region scored tracks as chapters two onward land.
