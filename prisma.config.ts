import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),

  // migrations-Ordner (optional anpassen)
  migrations: {
    path: path.join("prisma", "migrations"),
  },

  // datasource: die URL beziehen wir aus .env über env(...)
  datasource: {
    url: env("DATABASE_URL"),
  },
});
