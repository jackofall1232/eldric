import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'assets',
  server: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    outDir: 'build/web',
    emptyOutDir: true,
    sourcemap: true,
  },
});
