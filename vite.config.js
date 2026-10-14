import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages project sites are served from /<repository-name>/.
  // During local development keep the root path so `npm run dev` stays at localhost:5173.
  base: command === 'build' ? '/Argan-Simulation-3D/' : '/',
  server: {
    port: 5173,
    open: true
  }
}));
