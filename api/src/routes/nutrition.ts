import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { meals, mealItems, foods } from "../db/schema.js";
import { toGrams } from "../lib/nutrition.js";

export const nutritionRouter = new Hono()
  .get("/daily", async (c) => {
    const from = c.req.query("from");
    const to = c.req.query("to");
    if (!from || !to) return c.json({ error: "from and to are required" }, 400);

    const rows = await db
      .select({
        date: sql<string>`date(${meals.loggedAt})`,
        mealId: meals.id,
        quantity: mealItems.quantity,
        unit: mealItems.unit,
        caloriesPer100g: foods.caloriesPer100g,
        proteinPer100g: foods.proteinPer100g,
        carbsPer100g: foods.carbsPer100g,
        fatPer100g: foods.fatPer100g,
        servingSize: foods.servingSize,
      })
      .from(meals)
      .leftJoin(mealItems, eq(mealItems.mealId, meals.id))
      .leftJoin(foods, eq(mealItems.foodId, foods.id))
      .where(
        sql`${meals.isTemplate} = 0 AND date(${meals.loggedAt}) >= ${from} AND date(${meals.loggedAt}) <= ${to}`
      );

    const byDate = new Map<string, { date: string; kcal: number; prot: number; carb: number; fat: number; mealIds: Set<number> }>();

    for (const row of rows) {
      const key = row.date;
      if (!byDate.has(key)) {
        byDate.set(key, { date: key, kcal: 0, prot: 0, carb: 0, fat: 0, mealIds: new Set() });
      }
      const day = byDate.get(key)!;
      day.mealIds.add(row.mealId);

      if (row.quantity != null && row.unit) {
        const g = toGrams(row.quantity, row.unit, row.servingSize ?? null);
        day.kcal += ((row.caloriesPer100g ?? 0) * g) / 100;
        day.prot += ((row.proteinPer100g ?? 0) * g) / 100;
        day.carb += ((row.carbsPer100g ?? 0) * g) / 100;
        day.fat  += ((row.fatPer100g ?? 0) * g) / 100;
      }
    }

    return c.json(
      Array.from(byDate.values())
        .map(d => ({
          date: d.date,
          kcal: Math.round(d.kcal),
          prot: Math.round(d.prot),
          carb: Math.round(d.carb),
          fat:  Math.round(d.fat),
          meals: d.mealIds.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
  });
