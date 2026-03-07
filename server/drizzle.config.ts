import type { Config } from "drizzle-kit";

// Use PostgreSQL if DATABASE_URL is set, otherwise SQLite for local dev
const isPostgres = !!process.env.DATABASE_URL;

const config: Config = {
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: isPostgres ? "postgresql" : "sqlite",
    dbCredentials: isPostgres 
        ? { 
            url: process.env.DATABASE_URL!,
            ssl: { rejectUnauthorized: false }
          }
        : { url: "sovereign.sqlite" },
};

export default config;
