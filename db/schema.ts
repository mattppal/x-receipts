import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const xUserCache = pgTable("x_user_cache", {
  username: text("username").primaryKey(),
  data: jsonb("data").notNull(),
  cached_at: timestamp("cached_at").notNull().defaultNow(),
  trends_data: jsonb("trends_data"),
  trends_cached_at: timestamp("trends_cached_at"),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
