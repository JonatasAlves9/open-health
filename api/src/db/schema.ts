import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const foods = sqliteTable("foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  caloriesPer100g: real("calories_per_100g"),
  proteinPer100g: real("protein_per_100g"),
  carbsPer100g: real("carbs_per_100g"),
  fatPer100g: real("fat_per_100g"),
  fiberPer100g: real("fiber_per_100g"),
  source: text("source").notNull().default("manual"), // manual | taco | open_food_facts
  barcode: text("barcode"),
  defaultUnit: text("default_unit").notNull().default("g"), // g | ml | unidade | colher_sopa | colher_cha | xicara
  servingSize: real("serving_size"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const meals = sqliteTable("meals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isTemplate: integer("is_template", { mode: "boolean" }).notNull().default(false),
  loggedAt: text("logged_at"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const nutritionSettings = sqliteTable("nutrition_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const mealItems = sqliteTable("meal_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  mealId: integer("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  foodId: integer("food_id")
    .notNull()
    .references(() => foods.id),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(), // g | ml | unidade | colher_sopa | colher_cha | xicara
});
