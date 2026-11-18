import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único arquivo dist/index.html (abre com dois cliques, sem internet)
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2022', chunkSizeWarningLimit: 4000, assetsInlineLimit: 100000000 },
  server: { host: true, port: 5173 },
});
