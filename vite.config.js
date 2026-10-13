import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import offlinePlugin from "./build/offlinePlugin.js";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'charts';
          if (id.includes('node_modules/dexie')) return 'storage';
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    offlinePlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
});
