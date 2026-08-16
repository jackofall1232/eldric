import { Action } from '@eldric/engine';

export function mountMobileControls(root, touchSource) {
  const document = root.ownerDocument;
  const controls = document.createElement('div');
  controls.className = 'lc-touch-controls';
  controls.setAttribute('aria-label', 'Touch game controls');
  controls.innerHTML = `
    <div class="lc-stick" data-stick><span></span></div>
    <div class="lc-touch-actions">
      <button type="button" data-action="${Action.INTERACT}" aria-label="Interact">E<i class="lc-touch-label">Talk</i></button>
      <button type="button" data-action="${Action.BLOCK}" aria-label="Block">▰<i class="lc-touch-label">Guard</i></button>
      <button type="button" data-action="${Action.HEAVY}" aria-label="Heavy attack">◆<i class="lc-touch-label">Heavy</i></button>
      <button type="button" data-action="${Action.ATTACK}" aria-label="Attack">⚔<i class="lc-touch-label">Strike</i></button>
      <button type="button" data-action="${Action.DODGE}" aria-label="Dodge">↝<i class="lc-touch-label">Dodge</i></button>
    </div>
    <button type="button" class="lc-book-button" data-action="${Action.CHRONICLE}" aria-label="Open Chronicle">☷</button>`;
  root.append(controls);

  const abort = new AbortController();
  for (const button of controls.querySelectorAll('[data-action]')) {
    const action = button.dataset.action;
    const set = (down) => { touchSource.setAction(action, down); };
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); set(true); }, { signal: abort.signal });
    button.addEventListener('pointerup', () => set(false), { signal: abort.signal });
    button.addEventListener('pointercancel', () => set(false), { signal: abort.signal });
  }
  const stick = controls.querySelector('[data-stick]');
  const nub = stick.firstElementChild;
  const move = (event) => {
    const bounds = stick.getBoundingClientRect(); const x = (event.clientX - bounds.left - bounds.width / 2) / (bounds.width * .36); const y = (event.clientY - bounds.top - bounds.height / 2) / (bounds.height * .36);
    const raw = Math.hypot(x, y);
    const length = Math.max(1, raw); const nx = x / length, ny = y / length;
    // Pushing the stick well past the walk zone sprints, like holding Shift.
    touchSource.setAction(Action.RUN, raw > 1.25);
    stick.classList.toggle('lc-stick-running', raw > 1.25);
    touchSource.setMovement(nx, ny); nub.style.transform = `translate(${nx * 18}px, ${ny * 18}px)`;
  };
  stick.addEventListener('pointerdown', (event) => { stick.setPointerCapture(event.pointerId); move(event); }, { signal: abort.signal });
  stick.addEventListener('pointermove', (event) => { if (stick.hasPointerCapture(event.pointerId)) move(event); }, { signal: abort.signal });
  const reset = () => { touchSource.setMovement(0, 0); touchSource.setAction(Action.RUN, false); stick.classList.remove('lc-stick-running'); nub.style.transform = ''; };
  stick.addEventListener('pointerup', reset, { signal: abort.signal });
  stick.addEventListener('pointercancel', reset, { signal: abort.signal });
  return () => { abort.abort(); touchSource.reset(); controls.remove(); };
}
