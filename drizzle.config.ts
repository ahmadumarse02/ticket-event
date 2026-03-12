import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config(); // <-- loads process.env.DATABASE_URL

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});