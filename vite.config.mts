import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';

const pwaManifest = {
  name: 'CaritasApp',
  short_name: 'Caritas',
  display: 'standalone',
  start_url: '/',
  theme_color: '#f97316',
  background_color: '#ffffff',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
  ]
};

const DEBUG_LOG_PATH = '/Users/xcodeclub/Documents/careApp/.cursor/debug-1abaea.log';

function logServerDebug(entry: Record<string, unknown>) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(DEBUG_LOG_PATH, line, () => {});
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: pwaManifest
    })
  ],
  server: {
    port: 5173,
    host: 'localhost'
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (url.startsWith('/manifest.webmanifest')) {
        logServerDebug({
          sessionId: '1abaea',
          location: 'vite.config.mts:manifest',
          message: 'serve_manifest',
          data: { url },
          timestamp: Date.now(),
          hypothesisId: 'H6'
        });
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(JSON.stringify(pwaManifest));
        return;
      }
      next();
    });
  }
});

