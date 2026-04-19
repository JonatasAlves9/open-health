import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, like, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { exercises } from "../db/schema.js";

const exerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().default("outro"),
  equipment: z.string().optional(),
  description: z.string().optional(),
});

const WGER_BASE = "https://wger.de/api/v2";
const WGER_TIMEOUT_MS = 3000;

type WgerExerciseInfo = {
  id: number;
  category: { id: number; name: string };
  equipment: Array<{ id: number; name: string }>;
  translations: Array<{ language: number; name: string; description: string }>;
};

async function searchWger(term: string): Promise<typeof exercises.$inferSelect[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WGER_TIMEOUT_MS);
  try {
    // Fetch a page of exercises and filter client-side (wger search endpoint requires auth)
    const url = `${WGER_BASE}/exerciseinfo/?format=json&limit=100`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json() as { results: WgerExerciseInfo[] };
    const lc = term.toLowerCase();
    const matched = data.results.filter(ex =>
      ex.translations?.some(t => [2, 7].includes(t.language) && t.name.toLowerCase().includes(lc))
    );
    return matched.slice(0, 15).map(ex => {
      const translation = ex.translations?.find(t => [2, 7].includes(t.language) && t.name.toLowerCase().includes(lc))
        ?? ex.translations?.find(t => t.language === 2)
        ?? ex.translations?.[0];
      return {
        id: -(ex.id),
        name: translation?.name ?? `Exercise ${ex.id}`,
        muscleGroup: mapWgerCategory(ex.category?.name ?? ""),
        equipment: ex.equipment?.[0]?.name ?? null,
        wgerId: ex.id,
        gifUrl: `https://wger.de/exercise/${ex.id}/view/`,
        description: null,
        source: "wger",
        createdAt: new Date().toISOString(),
      };
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function mapWgerCategory(cat: string): string {
  const map: Record<string, string> = {
    "Abs": "core", "Arms": "braços", "Back": "costas", "Calves": "pernas",
    "Chest": "peito", "Legs": "pernas", "Shoulders": "ombros",
    "Cardio": "cardio",
  };
  return map[cat] ?? "outro";
}

export const exercisesRouter = new Hono()
  .get("/", async (c) => {
    const q = c.req.query("q") ?? "";
    const group = c.req.query("group");

    let localResults = await db.select().from(exercises).limit(50);

    if (q) {
      localResults = await db
        .select()
        .from(exercises)
        .where(or(like(exercises.name, `%${q}%`), like(exercises.namePt, `%${q}%`)))
        .limit(30);
    } else if (group) {
      localResults = await db
        .select()
        .from(exercises)
        .where(eq(exercises.muscleGroup, group))
        .limit(50);
    }

    if (q && localResults.length < 5) {
      const wgerResults = await searchWger(q);
      const existingWgerIds = new Set(localResults.filter(e => e.wgerId).map(e => e.wgerId));
      const newFromWger = wgerResults.filter(e => !existingWgerIds.has(e.wgerId));
      return c.json([...localResults, ...newFromWger]);
    }

    return c.json(localResults);
  })
  .post("/", zValidator("json", exerciseSchema), async (c) => {
    const data = c.req.valid("json");
    const [exercise] = await db.insert(exercises).values({ ...data, source: "manual" }).returning();
    return c.json(exercise, 201);
  })
  .post("/cache-wger", zValidator("json", z.object({
    wgerId: z.number(),
    name: z.string(),
    muscleGroup: z.string().default("outro"),
    equipment: z.string().optional(),
  })), async (c) => {
    const data = c.req.valid("json");
    const existing = await db.select().from(exercises).where(eq(exercises.wgerId, data.wgerId)).get();
    if (existing) return c.json(existing);
    const [exercise] = await db.insert(exercises).values({
      ...data,
      gifUrl: `https://wger.de/exercise/${data.wgerId}/view/`,
      source: "wger",
    }).returning();
    return c.json(exercise, 201);
  })
  .put("/:id", zValidator("json", exerciseSchema.partial()), async (c) => {
    const id = Number(c.req.param("id"));
    const existing = await db.select().from(exercises).where(eq(exercises.id, id)).get();
    if (!existing) return c.json({ error: "Not found" }, 404);
    if (existing.source !== "manual") return c.json({ error: "Exercícios do wger não podem ser editados" }, 403);
    const [updated] = await db.update(exercises).set(c.req.valid("json")).where(eq(exercises.id, id)).returning();
    return c.json(updated);
  });
