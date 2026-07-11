const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

const apiTarget = process.env.API_TARGET || "http://127.0.0.1:5000";

module.exports = defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: "dist"
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true
      },
      "/uploads": {
        target: apiTarget,
        changeOrigin: true
      }
    }
  }
});
