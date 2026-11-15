import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

// Football Blah-Blah lives next to Archery Maya and is built into
// dist/football-blah-blah so the same GitHub Pages deploy publishes both.
export default defineConfig({
  root: here,
  base: './',
  server: { port: 5175, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 4175, strictPort: true },
  build: {
    target: 'es2020',
    outDir: '../dist/football-blah-blah',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
  },
});
