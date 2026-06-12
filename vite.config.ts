import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '^/(api|create|get|view|update|delete|list|add|validate|onboard|report|sessions|session-items)': {
        target: 'https://lia-unmilked-jagger.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: "localhost",
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
