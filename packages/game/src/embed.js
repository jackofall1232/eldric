import './ui/game.css';
import { bootstrapGame } from './boot/bootstrap.js';

const instances = new WeakMap();

export function mount(element, config = {}) {
  unmount(element);
  const instance = bootstrapGame(element, config);
  instances.set(element, instance);
  return instance;
}

export function unmount(element) {
  const instance = instances.get(element);
  if (!instance) return false;
  instance.destroy();
  instances.delete(element);
  return true;
}

export function mountAll(scope = document) {
  const mounted = [];
  for (const element of scope.querySelectorAll('[data-eldric-game]')) {
    if (instances.has(element)) continue;
    const config = parseConfig(element.dataset.eldricConfig);
    mounted.push(mount(element, config));
  }
  return mounted;
}

function parseConfig(value) {
  if (!value) return {};
  try {
    const config = JSON.parse(value);
    return config && typeof config === 'object' && !Array.isArray(config) ? config : {};
  } catch {
    return {};
  }
}
