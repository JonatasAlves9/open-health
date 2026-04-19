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

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  namePt: text("name_pt"),
  muscleGroup: text("muscle_group").notNull().default("outro"),
  equipment: text("equipment"),
  wgerId: integer("wger_id"),
  gifUrl: text("gif_url"),
  description: text("description"),
  source: text("source").notNull().default("manual"), // manual | wger | free-exercise-db
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const workoutSessions = sqliteTable("workout_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isTemplate: integer("is_template", { mode: "boolean" }).notNull().default(false),
  loggedAt: text("logged_at"),
  notes: text("notes"),
  kcalBurned: real("kcal_burned"),
  bodyWeightKg: real("body_weight_kg"),
  templateId: integer("template_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const workoutSets = sqliteTable("workout_sets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weightKg: real("weight_kg"),
  rpe: real("rpe"),
  notes: text("notes"),
});

export const cardioSessions = sqliteTable("cardio_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").references(() => exercises.id, { onDelete: "set null" }),
  modality: text("modality").notNull().default("outro"), // corrida | caminhada | bike | natacao | outro
  durationMin: real("duration_min").notNull(),
  distanceKm: real("distance_km"),
  intensity: text("intensity").notNull().default("moderada"), // leve | moderada | intensa
  kcalBurned: real("kcal_burned"),
  notes: text("notes"),
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
