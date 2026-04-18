import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like } from "drizzle-orm";
import { db } from "../db/index.js";
import { foods } from "../db/schema.js";
import { roundFood, roundFoods } from "../db/round.js";

const foodSchema = z.object({
  name: z.string().min(1),
  caloriesPer100g: z.number().optional(),
  proteinPer100g: z.number().optional(),
  carbsPer100g: z.number().optional(),
  fatPer100g: z.number().optional(),
  fiberPer100g: z.number().optional(),
  source: z.enum(["manual", "taco", "open_food_facts"]).default("manual"),
  barcode: z.string().optional(),
  defaultUnit: z.enum(["g", "ml", "unidade", "colher_sopa", "colher_cha", "xicara"]).default("g"),
  servingSize: z.number().optional(),
});

type OFFProduct = {
  product_name?: string;
  product_name_pt?: string;
  product_name_pt_BR?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
};

function offProductName(p: OFFProduct): string {
  return p.product_name_pt_BR || p.product_name_pt || p.product_name || "";
}

async function searchOpenFoodFacts(q: string): Promise<OFFProduct[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&lc=pt&countries_tags=en:brazil`;
  const res = await fetch(url, { headers: { "User-Agent": "OpenHealth/1.0" } });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OFFProduct[] };
  return data.products ?? [];
}

async function fetchOFFByBarcode(barcode: string): Promise<OFFProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  const res = await fetch(url, { headers: { "User-Agent": "OpenHealth/1.0" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { status: number; product?: OFFProduct };
  return data.status === 1 ? (data.product ?? null) : null;
}

function offProductToFood(p: OFFProduct, barcode?: string) {
  const n = p.nutriments ?? {};
  return {
    name: offProductName(p) || "Sem nome",
    caloriesPer100g: n["energy-kcal_100g"] ?? null,
    proteinPer100g: n["proteins_100g"] ?? null,
    carbsPer100g: n["carbohydrates_100g"] ?? null,
    fatPer100g: n["fat_100g"] ?? null,
    fiberPer100g: n["fiber_100g"] ?? null,
    source: "open_food_facts" as const,
    barcode: barcode ?? null,
    defaultUnit: "g" as const,
  };
}

export const foodsRouter = new Hono()
  .get("/", async (c) => {
    const q = c.req.query("q");
    const barcode = c.req.query("barcode");
    const includeOff = c.req.query("off") !== "false";

    if (barcode) {
      const local = await db.select().from(foods).where(eq(foods.barcode, barcode)).get();
      if (local) return c.json([roundFood(local)]);

      const product = await fetchOFFByBarcode(barcode);
      if (!product || !offProductName(product)) return c.json([]);

      const [saved] = await db
        .insert(foods)
        .values(offProductToFood(product, barcode))
        .returning();
      return c.json([roundFood(saved)]);
    }

    if (q) {
      const local = await db
        .select()
        .from(foods)
        .where(like(foods.name, `%${q}%`))
        .limit(20);

      if (!includeOff || local.length >= 10) return c.json(roundFoods(local));

      const offResults = await searchOpenFoodFacts(q);
      const qLower = q.toLowerCase();
      const offFoods = offResults
        .filter((p) => {
          const name = offProductName(p).toLowerCase();
          return name && name.includes(qLower);
        })
        .map((p) => offProductToFood(p))
        .slice(0, 10 - local.length);

      return c.json([...roundFoods(local), ...offFoods.map((f) => ({ ...roundFood(f), id: -1 }))]);
    }

    const all = await db.select().from(foods).limit(50);
    return c.json(roundFoods(all));
  })
  .post("/", zValidator("json", foodSchema), async (c) => {
    const data = c.req.valid("json");
    const [food] = await db.insert(foods).values(data).returning();
    return c.json(food, 201);
  })
  .post("/import-off", zValidator("json", z.object({ name: z.string(), barcode: z.string().optional(), caloriesPer100g: z.number().optional(), proteinPer100g: z.number().optional(), carbsPer100g: z.number().optional(), fatPer100g: z.number().optional(), fiberPer100g: z.number().optional() })), async (c) => {
    const data = c.req.valid("json");
    const [food] = await db.insert(foods).values({ ...data, source: "open_food_facts", defaultUnit: "g" }).returning();
    return c.json(roundFood(food), 201);
  })
  .put("/:id", zValidator("json", foodSchema.partial()), async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");
    const [food] = await db.update(foods).set(data).where(eq(foods.id, id)).returning();
    if (!food) return c.json({ error: "Not found" }, 404);
    return c.json(food);
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const [food] = await db.delete(foods).where(eq(foods.id, id)).returning();
    if (!food) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true });
  });
