import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { meals, mealItems, foods } from "../db/schema.js";
import { roundFood } from "../db/round.js";

const mealItemSchema = z.object({
  foodId: z.number(),
  quantity: z.number().positive(),
  unit: z.enum(["g", "ml", "unidade", "colher_sopa", "colher_cha", "xicara"]),
});

const mealSchema = z.object({
  name: z.string().min(1),
  isTemplate: z.boolean().default(false),
  loggedAt: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(mealItemSchema).optional(),
});

async function getMealWithItems(mealId: number) {
  const meal = await db.select().from(meals).where(eq(meals.id, mealId)).get();
  if (!meal) return null;

  const items = await db
    .select({
      id: mealItems.id,
      mealId: mealItems.mealId,
      quantity: mealItems.quantity,
      unit: mealItems.unit,
      food: foods,
    })
    .from(mealItems)
    .innerJoin(foods, eq(mealItems.foodId, foods.id))
    .where(eq(mealItems.mealId, mealId));

  return { ...meal, items: items.map((i) => ({ ...i, food: roundFood(i.food) })) };
}

export const mealsRouter = new Hono()
  .get("/", async (c) => {
    const date = c.req.query("date");
    const templates = c.req.query("templates") === "true";

    let query = db.select().from(meals).orderBy(desc(meals.createdAt)).limit(50);

    if (templates) {
      query = db
        .select()
        .from(meals)
        .where(eq(meals.isTemplate, true))
        .orderBy(desc(meals.createdAt))
        .limit(50) as typeof query;
    } else if (date) {
      query = db
        .select()
        .from(meals)
        .where(
          sql`${meals.isTemplate} = 0 AND date(${meals.loggedAt}) = ${date}`
        )
        .orderBy(desc(meals.loggedAt))
        .limit(50) as typeof query;
    }

    return c.json(await query);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const meal = await getMealWithItems(id);
    if (!meal) return c.json({ error: "Not found" }, 404);
    return c.json(meal);
  })
  .post("/", zValidator("json", mealSchema), async (c) => {
    const { items, ...mealData } = c.req.valid("json");

    const [meal] = await db.insert(meals).values(mealData).returning();

    if (items?.length) {
      await db.insert(mealItems).values(
        items.map((item) => ({ ...item, mealId: meal.id }))
      );
    }

    return c.json(await getMealWithItems(meal.id), 201);
  })
  // Cria log a partir de um template
  .post("/:id/log", async (c) => {
    const templateId = Number(c.req.param("id"));
    const template = await getMealWithItems(templateId);
    if (!template || !template.isTemplate) {
      return c.json({ error: "Template não encontrado" }, 404);
    }

    const [newMeal] = await db
      .insert(meals)
      .values({
        name: template.name,
        isTemplate: false,
        loggedAt: new Date().toISOString(),
        notes: template.notes,
      })
      .returning();

    if (template.items.length) {
      await db.insert(mealItems).values(
        template.items.map((item) => ({
          mealId: newMeal.id,
          foodId: item.food.id,
          quantity: item.quantity,
          unit: item.unit,
        }))
      );
    }

    return c.json(await getMealWithItems(newMeal.id), 201);
  })
  .put("/:id", zValidator("json", mealSchema.partial()), async (c) => {
    const id = Number(c.req.param("id"));
    const { items, ...mealData } = c.req.valid("json");

    const [meal] = await db.update(meals).set(mealData).where(eq(meals.id, id)).returning();
    if (!meal) return c.json({ error: "Not found" }, 404);

    if (items !== undefined) {
      await db.delete(mealItems).where(eq(mealItems.mealId, id));
      if (items.length) {
        await db.insert(mealItems).values(items.map((item) => ({ ...item, mealId: id })));
      }
    }

    return c.json(await getMealWithItems(id));
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const [meal] = await db.delete(meals).where(eq(meals.id, id)).returning();
    if (!meal) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true });
  });
