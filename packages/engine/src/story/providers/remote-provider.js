import { StoryProvider } from '../provider.js';

export class RemoteStoryProvider extends StoryProvider {
  constructor({ transport, endpoint, nonce, timeoutMs = 5000 } = {}) {
    super(); if (!transport?.request || !endpoint) throw new TypeError('Remote provider requires transport and endpoint.');
    this.transport = transport; this.endpoint = endpoint; this.nonce = nonce; this.timeoutMs = timeoutMs;
  }
  generate(context) {
    return this.transport.request({ url: this.endpoint, method: 'POST', headers: { 'Content-Type': 'application/json', ...(this.nonce ? { 'X-WP-Nonce': this.nonce } : {}) }, body: JSON.stringify({ context }), timeoutMs: this.timeoutMs, maxResponseBytes: 32_768 });
  }
}
