import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// API origin that both the dev and preview servers proxy /api to (your local
// Django). Override with VITE_PROXY_TARGET if Django runs elsewhere.
const API_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:8000'

// Shared by the dev server and the production-preview server:
//  - allowedHosts: accept tunnel hostnames (cloudflared/ngrok/localtunnel)
//  - proxy /api → Django so the whole app is one origin (one tunnel, no CORS)
const shared = {
  port: 5174,
  strictPort: true,
  allowedHosts: true,
  proxy: {
    '/api': {
      target: API_TARGET,
      changeOrigin: true,
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: shared,
  // `npm run build && npm run preview` serves the built app with no HMR — the
  // stable way to share over a tunnel. Same port + proxy as dev.
  preview: shared,
})
