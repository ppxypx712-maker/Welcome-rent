import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: [
      'all',
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    cors: true,
    allowedHosts: [
      'all',
      '.trycloudflare.com',
      'localhost'
    ]
  }
});

