// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.v2.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.POSTGRES_URL! },
} satisfies Config;
