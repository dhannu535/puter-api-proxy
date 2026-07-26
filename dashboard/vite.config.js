import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/dashboard/",
  server: {
    proxy: {
      "/api": "http://localhost:3800",
      "/v1": "http://localhost:3800",
    },
  },
  build: {
    outDir: "dist",
  },
});
