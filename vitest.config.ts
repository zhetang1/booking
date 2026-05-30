import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    // Point the data layer at a dedicated test database. Override with
    // TEST_DATABASE_URL if your local Postgres uses a different user/host.
    // Resend/owner env are intentionally left unset so notifications no-op.
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL || "postgres://localhost:5432/swim_test",
    },
  },
});
