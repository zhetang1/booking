import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    // Playwright owns ./e2e (*.spec.ts); keep vitest out of it.
    exclude: ["e2e/**", "node_modules/**"],
    // Point the data layer at a dedicated test database. Override with
    // TEST_DATABASE_URL if your local Postgres uses a different user/host.
    // Resend/admin env are intentionally left unset so notifications no-op.
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL || "postgres://localhost:5432/swim_test",
    },
  },
});
