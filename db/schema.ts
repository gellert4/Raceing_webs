import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const waitlist = sqliteTable("waitlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  language: text("language").notNull().default("EN"),
  source: text("source").notNull().default("drop-001"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [uniqueIndex("idx_waitlist_email").on(table.email)]);
