import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/sw",
      filename: "sw.ts",
      manifest: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff2}"],
        globIgnores: [
          "**/vendor-*.js",
          "**/pdf.worker.min*.mjs",
          "**/pdf-*.js",
          "**/jspdf*.js",
          "**/xlsx-*.js",
          "**/mammoth-*.js",
          "**/html2canvas*.js",
          "**/marked*.js",
          "**/tesseract*.js",
          "**/index.es-*.js",
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  build: {
    target: "esnext",
    modulePreload: {
      polyfill: false,
    },
  },
});
