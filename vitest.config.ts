import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      VITE_AI_GATEWAY_URL: "http://localhost:8787",
      VITE_NTFY_URL: "https://ntfy.sh/test-topic",
      VITE_KEEPALIVE_URL: "https://test-keepalive.example.com",
    },
    include: ["src/tests/**/*.test.ts", "workers/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/ai/**",
        "src/data/local-store.ts",
        "src/data/supabase.ts",
        "src/services/notifications.ts",
        "workers/**",
      ],
      // T9.5 — Pragul minim de coverage; build CI eșuează dacă scade sub.
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
