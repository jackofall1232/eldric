import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'assets',
  build: {
    outDir: 'wordpress/living-chronicle/assets/build',
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(import.meta.dirname, 'packages/game/src/embed.js'),
      name: 'EldricLivingChronicle',
      formats: ['iife'],
      fileName: () => 'eldric-living-chronicle.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith('.css')
          ? 'eldric-living-chronicle.css'
          : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
