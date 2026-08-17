// The "?" help dropdown: a DOM overlay listing every control, grouped by
// purpose, with both keyboard and touch bindings, plus the sound controls.
// DOM (not canvas) so the text is crisp at any size and reachable by screen
// readers.

import { audioSectionMarkup, bindAudioSection } from './audio-controls.js';

const CONTROL_GROUPS = [
  {
    title: 'Movement',
    rows: [
      { name: 'Move', keys: ['W', 'A', 'S', 'D'], alt: 'or arrow keys', chip: '✥' },
      { name: 'Run', keys: ['Shift'], alt: 'hold', touch: 'push stick to its edge' },
    ],
  },
  {
    title: 'Combat',
    rows: [
      { name: 'Attack', keys: ['J'], chip: '⚔' },
      { name: 'Heavy attack', keys: ['K'], chip: '◆' },
      { name: 'Block', keys: ['L'], alt: 'hold', chip: '▰' },
      { name: 'Dodge roll', keys: ['Space'], chip: '↝' },
    ],
  },
  {
    title: 'World',
    rows: [
      { name: 'Interact · Talk', keys: ['E'], chip: 'E' },
      { name: 'Rest at campfire', keys: ['E'], chip: 'E' },
    ],
  },
  {
    title: 'Menus',
    rows: [
      { name: 'Chronicle (journal)', keys: ['Tab'], chip: '☷' },
      { name: 'Satchel (inventory)', keys: ['I'] },
      { name: 'Close · Leave', keys: ['Esc'] },
    ],
  },
];

function isTypingTarget(target) {
  const tag = target?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable === true;
}

function bindingsMarkup(row) {
  const keys = row.keys.map((key) => `<span class="lc-help-key">${key}</span>`).join('');
  const alt = row.alt ? `<span class="lc-help-alt">${row.alt}</span>` : '';
  const chip = row.chip ? `<span class="lc-help-chip">${row.chip}</span>` : '';
  const touch = row.touch ? `<span class="lc-help-alt">· ${row.touch}</span>` : '';
  return `${keys}${alt}${chip}${touch}`;
}

export function mountHelpMenu(root, { audio = null, onAudioChange = () => {} } = {}) {
  const document = root.ownerDocument;
  const wrap = document.createElement('div');
  wrap.className = 'lc-help';
  const panelId = 'lc-help-panel';
  wrap.innerHTML = `
    <button type="button" class="lc-help-button" aria-expanded="false" aria-controls="${panelId}" aria-label="How to play — controls">?</button>
    <div class="lc-help-backdrop" hidden></div>
    <section id="${panelId}" class="lc-help-panel" hidden aria-label="Controls">
      <h2>How to Play</h2>
      <button type="button" class="lc-help-close" aria-label="Close help">✕</button>
      ${CONTROL_GROUPS.map((group) => `
        <h3>${group.title}</h3>
        ${group.rows.map((row) => `
          <div class="lc-help-row">
            <span class="lc-help-name">${row.name}</span>
            <span class="lc-help-keys">${bindingsMarkup(row)}</span>
          </div>`).join('')}`).join('')}
      ${audio ? audioSectionMarkup() : ''}
      <p class="lc-help-footnote">The Chronicle remembers what you do. Rest at the campfire to heal and write your page.</p>
    </section>`;
  root.append(wrap);

  const button = wrap.querySelector('.lc-help-button');
  const backdrop = wrap.querySelector('.lc-help-backdrop');
  const panel = wrap.querySelector('.lc-help-panel');
  const close = wrap.querySelector('.lc-help-close');
  const abort = new AbortController();
  const setOpen = (open) => {
    panel.hidden = !open;
    backdrop.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('lc-help-button-open', open);
    if (!open) root.querySelector('.lc-game-canvas')?.focus?.({ preventScroll: true });
  };
  const isOpen = () => !panel.hidden;
  button.addEventListener('click', () => setOpen(!isOpen()), { signal: abort.signal });
  close.addEventListener('click', () => setOpen(false), { signal: abort.signal });
  backdrop.addEventListener('pointerdown', () => setOpen(false), { signal: abort.signal });
  // Swallow pointer events so an open panel never steers the game beneath it.
  for (const element of [button, panel, backdrop]) {
    element.addEventListener('pointerdown', (event) => event.stopPropagation(), { signal: abort.signal });
  }
  const sound = audio ? bindAudioSection(panel, audio, { signal: abort.signal, onChange: onAudioChange }) : null;
  // Refresh on open: mute may have been toggled with M while the panel was shut.
  button.addEventListener('click', () => sound?.refresh?.(), { signal: abort.signal });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) { event.stopPropagation(); setOpen(false); }
    // M mutes from anywhere. Ignored while a text field has focus so it never
    // eats a letter someone is typing into the page around the game.
    if ((event.key === 'm' || event.key === 'M') && !event.metaKey && !event.ctrlKey && !event.altKey
      && !isTypingTarget(event.target)) sound?.toggleMute?.();
  }, { capture: true, signal: abort.signal });

  return () => { abort.abort(); wrap.remove(); };
}
