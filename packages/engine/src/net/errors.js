export class NetworkError extends Error { constructor(code, message = code) { super(message); this.name = 'NetworkError'; this.code = code; } }
