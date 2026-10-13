import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import offlinePlugin from "./build/offlinePlugin.js";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
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
