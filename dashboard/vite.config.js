import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/puter-api-proxy/dashboard/",
  server: {
    proxy: {
      "/puter-api-proxy/api": "http://localhost:3800",
      "/puter-api-proxy/v1": "http://localhost:3800",
    },
  },
  build: {
    outDir: "dist",
  },
});
