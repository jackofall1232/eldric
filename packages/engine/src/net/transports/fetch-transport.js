import { NetworkError } from '../errors.js';
import { Transport } from '../transport.js';

export class FetchTransport extends Transport {
  constructor(fetchImplementation = fetch) { super(); this.fetch = fetchImplementation; }
  async request({ url, method = 'GET', headers = {}, body, timeoutMs = 5000, maxResponseBytes = 32_768 }) {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetch(url, { method, headers, body, signal: controller.signal, credentials: 'same-origin' });
      if (!response.ok) throw new NetworkError('http_error');
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > maxResponseBytes) throw new NetworkError('response_too_large');
      try { return JSON.parse(text); } catch { throw new NetworkError('malformed_response'); }
    } catch (error) { if (error?.name === 'AbortError') throw new NetworkError('timeout'); throw error; }
    finally { clearTimeout(timeout); }
  }
}
