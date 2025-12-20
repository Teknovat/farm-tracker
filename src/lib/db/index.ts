import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Determine if we're in production based on environment
const isProduction = process.env.NODE_ENV === "production" || process.env.USE_TURSO === "true";

// Production: Use Turso remote (libsql://...)
// Development: Use libsql local file (file:./sqlite.db)
const databaseUrl = process.env.TURSO_DATABASE_URL || "file:./sqlite.db";

const client = createClient({
  url: databaseUrl,
  authToken: isProduction ? process.env.TURSO_AUTH_TOKEN : undefined,
});

export const db = drizzle({
  client,
  schema,
});

export * from "./schema";
