import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../src/lib/db/schema";

async function runMigrations() {
  const isProduction = process.env.NODE_ENV === "production" || process.env.USE_TURSO === "true";
  const databaseUrl = process.env.TURSO_DATABASE_URL || "file:./sqlite.db";

  console.log("🔄 Running database migrations...");
  console.log(`📍 Environment: ${isProduction ? "Production" : "Development"}`);
  console.log(`🗄️  Database: ${databaseUrl.replace(/:.+@/, ":***@")}`); // Hide auth token in URL

  try {
    const client = createClient({
      url: databaseUrl,
      authToken: isProduction ? process.env.TURSO_AUTH_TOKEN : undefined,
    });

    const db = drizzle({ client, schema });

    await migrate(db, { migrationsFolder: "./drizzle" });

    console.log("✅ Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
