import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // necessário para rodar em ambientes como Replit/Codespaces
    allowedHosts: true, // aceita o domínio público gerado pelo Replit/Codespaces
  },
});
