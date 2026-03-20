import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Sitemap from "vite-plugin-sitemap";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  plugins: [
    react(),
    Sitemap({
      hostname: "https://kanzleistelle24.de",
      // Vite-Plugin scannt nur begrenzt SPA-Routen automatisch.
      // Daher tragen wir die statischen/öffentlichen Routen manuell ein.
      dynamicRoutes: [
        "/karrieretipps",
        "/karriere-tipps",
        "/loesungen",
        "/fuer-arbeitgeber",
        "/ueber-uns",
        "/impressum",
        "/agb",
        "/datenschutz",
        "/register-employer",
        "/login",
        "/passwort-vergessen",
        "/passwort-zuruecksetzen",
      ],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
