// Sound controls for the help panel: a mute switch and one slider per bus.
//
// DOM rather than canvas, like the rest of the help panel — range inputs are
// keyboard-operable, screen-reader labelled, and draggable on touch for free,
// none of which a canvas-drawn slider would be.

const SLIDERS = [
  { bus: 'master', label: 'Overall' },
  { bus: 'music', label: 'Music' },
  { bus: 'sfx', label: 'Effects' },
  { bus: 'ambience', label: 'Ambience' },
];

const percent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

export function audioSectionMarkup() {
  return `
    <h3>Sound</h3>
    <div class="lc-audio">
      <button type="button" class="lc-audio-mute" aria-pressed="false">
        <span class="lc-audio-mute-icon" aria-hidden="true">♫</span><span class="lc-audio-mute-label">Sound on</span>
      </button>
      ${SLIDERS.map((slider) => `
        <label class="lc-audio-row">
          <span class="lc-audio-label">${slider.label}</span>
          <input type="range" class="lc-audio-range" data-bus="${slider.bus}"
                 min="0" max="100" step="1" value="0" aria-label="${slider.label} volume">
          <output class="lc-audio-value" data-for="${slider.bus}">0%</output>
        </label>`).join('')}
    </div>
    <p class="lc-help-footnote lc-audio-note">Press <span class="lc-help-key">M</span> to mute at any time. Your levels are remembered.</p>`;
}

/**
 * Wire the section to a live AudioSystem. `onChange` receives the mixer
 * snapshot whenever the player moves anything, for persistence.
 */
export function bindAudioSection(scope, audio, { signal, onChange = () => {} } = {}) {
  const mute = scope.querySelector('.lc-audio-mute');
  const ranges = [...scope.querySelectorAll('.lc-audio-range')];
  if (!mute || !ranges.length) return () => {};

  const paint = () => {
    const levels = audio.volumes();
    mute.setAttribute('aria-pressed', String(levels.muted));
    mute.classList.toggle('lc-audio-muted', levels.muted);
    mute.querySelector('.lc-audio-mute-icon').textContent = levels.muted ? '⃠' : '♫';
    mute.querySelector('.lc-audio-mute-label').textContent = levels.muted ? 'Muted' : 'Sound on';
    for (const range of ranges) {
      const value = levels[range.dataset.bus] ?? 0;
      // Don't fight the thumb the player is currently dragging.
      if (scope.ownerDocument.activeElement !== range) range.value = String(Math.round(value * 100));
      range.disabled = levels.muted;
      const readout = scope.querySelector(`.lc-audio-value[data-for="${range.dataset.bus}"]`);
      if (readout) readout.textContent = percent(value);
    }
  };

  const commit = () => { paint(); onChange(audio.volumes()); };

  for (const range of ranges) {
    range.addEventListener('input', () => {
      const value = Number(range.value) / 100;
      if (range.dataset.bus === 'master') audio.setMasterVolume(value);
      else audio.setVolume(range.dataset.bus, value);
      commit();
    }, { signal });
  }
  mute.addEventListener('click', () => { audio.toggleMuted(); commit(); }, { signal });

  paint();
  return { refresh: paint, toggleMute: () => { audio.toggleMuted(); commit(); } };
}
