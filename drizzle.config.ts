import type { Config } from "drizzle-kit";

export default {
  schema: ["./src/lib/db/schema.ts", "./src/lib/db/relations.ts"],
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
