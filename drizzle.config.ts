import type { Config } from "drizzle-kit";

const isProduction = process.env.NODE_ENV === "production" || process.env.USE_TURSO === "true";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
    : {
        url: process.env.TURSO_DATABASE_URL || "file:./sqlite.db",
      },
} satisfies Config;
