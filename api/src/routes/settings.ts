import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { nutritionSettings } from "../db/schema.js";

export const settingsRouter = new Hono()
  .get("/", async (c) => {
    const rows = await db.select().from(nutritionSettings);
    const obj: Record<string, unknown> = {};
    for (const r of rows) {
      try { obj[r.key] = JSON.parse(r.value); } catch { obj[r.key] = r.value; }
    }
    return c.json(obj);
  })
  .put("/:key", async (c) => {
    const key = c.req.param("key");
    const body = await c.req.json();
    const value = JSON.stringify(body);
    const now = new Date().toISOString();
    await db
      .insert(nutritionSettings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({ target: nutritionSettings.key, set: { value, updatedAt: now } });
    return c.json({ key, value: body });
  });
