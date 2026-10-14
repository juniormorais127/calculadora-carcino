import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import offlinePlugin from "./build/offlinePlugin.js";

// Versão do app injetada no bundle: vai no relato de suporte, para o atendimento
// saber exatamente qual build o produtor está usando
const { version: versaoDoApp } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(versaoDoApp)
  },
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
