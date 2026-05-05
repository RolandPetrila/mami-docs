import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      VITE_AI_GATEWAY_URL: "http://localhost:8787",
      VITE_NTFY_URL: "https://ntfy.sh/test-topic",
      VITE_CALLMEBOT_API_KEY: "test-key",
      VITE_PHONE_NUMBER: "+40700000000",
    },
    include: ["src/tests/**/*.test.ts", "workers/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/ai/**",
        "src/data/local-store.ts",
        "src/services/notifications.ts",
        "workers/**",
      ],
    },
  },
});
