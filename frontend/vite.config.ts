import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        timeout: 300000,
        proxyTimeout: 300000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[Vite Proxy Warning]:', err.message);
            // Respond cleanly to client if response headers were not already committed
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: {
                  code: 'BACKEND_ERROR',
                  message: 'The Vite development proxy could not reach the backend at http://127.0.0.1:5000. Verify the backend service is running on port 5000.',
                  retryable: true,
                  details: err.message
                },
                timestamp: new Date().toISOString()
              }));
            }
          });
        },
      },
    },
  },
})

