import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

// Math Quest lives next to Archery Maya and is built into dist/math-quest
// so the same GitHub Pages deploy publishes all the games.
export default defineConfig({
  root: here,
  base: './',
  server: { port: 5176, strictPort: true, fs: { allow: ['..'] } },
  preview: { port: 4176, strictPort: true },
  build: {
    target: 'es2020',
    outDir: '../dist/math-quest',
    emptyOutDir: true,
  },
});
