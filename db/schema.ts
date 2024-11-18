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
});

export const personalizedTrendsCache = pgTable("personalized_trends_cache", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  data: jsonb("data").notNull(),
  cached_at: timestamp("cached_at").notNull().defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
