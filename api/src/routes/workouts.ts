import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, sql, and, gte, lte, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { workoutSessions, workoutSets, cardioSessions, exercises } from "../db/schema.js";

const MET: Record<string, Record<string, number>> = {
  corrida:   { leve: 6.0, moderada: 9.8, intensa: 14.5 },
  caminhada: { leve: 2.8, moderada: 3.8, intensa: 5.0 },
  bike:      { leve: 4.0, moderada: 7.5, intensa: 12.0 },
  natacao:   { leve: 5.0, moderada: 7.0, intensa: 10.0 },
  outro:     { leve: 3.5, moderada: 5.0, intensa: 8.0 },
};

function calcCardioKcal(modality: string, intensity: string, durationMin: number, bodyWeightKg: number): number {
  const met = (MET[modality] ?? MET["outro"])[intensity] ?? 5.0;
  return met * bodyWeightKg * (durationMin / 60);
}

// MET 5.0 para treino de força moderado (ACSM/Compendium of Physical Activities)
// Cada set (trabalho + descanso) ≈ 3 minutos no total
const STRENGTH_MET = 5.0;
const MINUTES_PER_SET = 3;

function calcStrengthKcal(
  sets: { reps?: number | null; weightKg?: number | null }[],
  bodyWeightKg: number | null | undefined,
): number {
  if (!sets.length) return 0;
  const bw = bodyWeightKg ?? 75; // peso médio se não informado
  return STRENGTH_MET * bw * (sets.length * MINUTES_PER_SET / 60);
}

const workoutSetSchema = z.object({
  exerciseId: z.number(),
  setNumber: z.number().int().positive(),
  reps: z.number().int().optional(),
  weightKg: z.number().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

const cardioSchema = z.object({
  exerciseId: z.number().optional(),
  modality: z.enum(["corrida", "caminhada", "bike", "natacao", "outro"]).default("outro"),
  durationMin: z.number().positive(),
  distanceKm: z.number().optional(),
  intensity: z.enum(["leve", "moderada", "intensa"]).default("moderada"),
  notes: z.string().optional(),
});

const sessionSchema = z.object({
  name: z.string().min(1),
  isTemplate: z.boolean().default(false),
  loggedAt: z.string().optional(),
  notes: z.string().optional(),
  bodyWeightKg: z.number().optional(),
  templateId: z.number().optional(),
  sets: z.array(workoutSetSchema).optional(),
  cardio: z.array(cardioSchema).optional(),
});

async function getSessionWithDetails(sessionId: number) {
  const session = await db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId)).get();
  if (!session) return null;

  const sets = await db
    .select({ set: workoutSets, exercise: exercises })
    .from(workoutSets)
    .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.sessionId, sessionId))
    .orderBy(asc(workoutSets.setNumber));

  const cardios = await db
    .select({ cardio: cardioSessions, exercise: exercises })
    .from(cardioSessions)
    .leftJoin(exercises, eq(cardioSessions.exerciseId, exercises.id))
    .where(eq(cardioSessions.sessionId, sessionId));

  return {
    ...session,
    sets: sets.map(r => ({ ...r.set, exercise: r.exercise })),
    cardio: cardios.map(r => ({ ...r.cardio, exercise: r.exercise })),
  };
}

async function computeAndSaveKcal(
  sessionId: number,
  sets: { reps?: number | null; weightKg?: number | null }[],
  cardios: { modality: string; intensity: string; durationMin: number }[],
  bodyWeightKg?: number | null,
): Promise<number> {
  const strengthKcal = sets.length ? calcStrengthKcal(sets, bodyWeightKg) : 0;
  const cardioKcal = cardios.reduce((sum, c) => {
    return sum + (bodyWeightKg ? calcCardioKcal(c.modality, c.intensity, c.durationMin, bodyWeightKg) : 0);
  }, 0);
  const total = Math.round(strengthKcal + cardioKcal);
  await db.update(workoutSessions).set({ kcalBurned: total }).where(eq(workoutSessions.id, sessionId));
  return total;
}

export const workoutsRouter = new Hono()
  .get("/daily", async (c) => {
    const from = c.req.query("from");
    const to = c.req.query("to");
    if (!from || !to) return c.json({ error: "from and to required" }, 400);

    const rows = await db
      .select({
        date: sql<string>`date(${workoutSessions.loggedAt})`,
        sessions: sql<number>`count(*)`,
        kcal: sql<number>`coalesce(sum(${workoutSessions.kcalBurned}), 0)`,
      })
      .from(workoutSessions)
      .where(
        sql`${workoutSessions.isTemplate} = 0 AND date(${workoutSessions.loggedAt}) >= ${from} AND date(${workoutSessions.loggedAt}) <= ${to}`
      )
      .groupBy(sql`date(${workoutSessions.loggedAt})`);

    return c.json(rows);
  })
  .get("/progression/:exerciseId", async (c) => {
    const exerciseId = Number(c.req.param("exerciseId"));

    const rows = await db
      .select({
        date: sql<string>`date(${workoutSessions.loggedAt})`,
        maxWeight: sql<number>`max(${workoutSets.weightKg})`,
        maxReps: sql<number>`max(${workoutSets.reps})`,
        totalVolume: sql<number>`sum(coalesce(${workoutSets.weightKg}, 0) * coalesce(${workoutSets.reps}, 0))`,
        totalSets: sql<number>`count(*)`,
      })
      .from(workoutSets)
      .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
      .where(
        and(
          eq(workoutSets.exerciseId, exerciseId),
          eq(workoutSessions.isTemplate, false),
          sql`${workoutSessions.loggedAt} IS NOT NULL`
        )
      )
      .groupBy(sql`date(${workoutSessions.loggedAt})`)
      .orderBy(asc(sql`date(${workoutSessions.loggedAt})`));

    const withEpley = rows.map(r => ({
      ...r,
      orm: r.maxWeight && r.maxReps ? Math.round(r.maxWeight * (1 + r.maxReps / 30)) : null,
    }));

    return c.json(withEpley);
  })
  .get("/", async (c) => {
    const date = c.req.query("date");
    const templates = c.req.query("templates") === "true";

    let query;
    if (templates) {
      query = db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.isTemplate, true))
        .orderBy(desc(workoutSessions.createdAt))
        .limit(50);
    } else if (date) {
      query = db
        .select()
        .from(workoutSessions)
        .where(sql`${workoutSessions.isTemplate} = 0 AND date(${workoutSessions.loggedAt}) = ${date}`)
        .orderBy(desc(workoutSessions.loggedAt))
        .limit(50);
    } else {
      query = db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.isTemplate, false))
        .orderBy(desc(workoutSessions.loggedAt))
        .limit(50);
    }

    return c.json(await query);
  })
  .get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const session = await getSessionWithDetails(id);
    if (!session) return c.json({ error: "Not found" }, 404);
    return c.json(session);
  })
  .post("/", zValidator("json", sessionSchema), async (c) => {
    const { sets, cardio, ...sessionData } = c.req.valid("json");

    const [session] = await db.insert(workoutSessions).values(sessionData).returning();

    if (sets?.length) {
      await db.insert(workoutSets).values(sets.map(s => ({ ...s, sessionId: session.id })));
    }
    if (cardio?.length) {
      await db.insert(cardioSessions).values(cardio.map(c => ({ ...c, sessionId: session.id })));
    }

    await computeAndSaveKcal(
      session.id,
      sets ?? [],
      (cardio ?? []).map(c => ({ modality: c.modality, intensity: c.intensity, durationMin: c.durationMin })),
      sessionData.bodyWeightKg,
    );

    return c.json(await getSessionWithDetails(session.id), 201);
  })
  .post("/:id/log", async (c) => {
    const templateId = Number(c.req.param("id"));
    const template = await getSessionWithDetails(templateId);
    if (!template || !template.isTemplate) {
      return c.json({ error: "Template não encontrado" }, 404);
    }

    const now = new Date().toISOString();
    const [session] = await db
      .insert(workoutSessions)
      .values({
        name: template.name,
        isTemplate: false,
        loggedAt: now,
        notes: template.notes,
        bodyWeightKg: template.bodyWeightKg,
        templateId: template.id,
      })
      .returning();

    if (template.sets.length) {
      await db.insert(workoutSets).values(
        template.sets.map(s => ({
          sessionId: session.id,
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
          rpe: s.rpe,
          notes: s.notes,
        }))
      );
    }
    if (template.cardio.length) {
      await db.insert(cardioSessions).values(
        template.cardio.map(c => ({
          sessionId: session.id,
          exerciseId: c.exerciseId,
          modality: c.modality,
          durationMin: c.durationMin,
          distanceKm: c.distanceKm,
          intensity: c.intensity,
          notes: c.notes,
        }))
      );
    }

    await computeAndSaveKcal(
      session.id,
      template.sets,
      template.cardio.map(c => ({ modality: c.modality, intensity: c.intensity, durationMin: c.durationMin })),
      session.bodyWeightKg,
    );

    return c.json(await getSessionWithDetails(session.id), 201);
  })
  .put("/:id", zValidator("json", sessionSchema.partial()), async (c) => {
    const id = Number(c.req.param("id"));
    const { sets, cardio, ...sessionData } = c.req.valid("json");

    const [session] = await db.update(workoutSessions).set(sessionData).where(eq(workoutSessions.id, id)).returning();
    if (!session) return c.json({ error: "Not found" }, 404);

    if (sets !== undefined) {
      await db.delete(workoutSets).where(eq(workoutSets.sessionId, id));
      if (sets.length) {
        await db.insert(workoutSets).values(sets.map(s => ({ ...s, sessionId: id })));
      }
    }
    if (cardio !== undefined) {
      await db.delete(cardioSessions).where(eq(cardioSessions.sessionId, id));
      if (cardio.length) {
        await db.insert(cardioSessions).values(cardio.map(c => ({ ...c, sessionId: id })));
      }
    }

    const fullSession = await getSessionWithDetails(id);
    await computeAndSaveKcal(
      id,
      fullSession?.sets ?? [],
      (fullSession?.cardio ?? []).map(c => ({ modality: c.modality, intensity: c.intensity, durationMin: c.durationMin })),
      fullSession?.bodyWeightKg,
    );

    return c.json(await getSessionWithDetails(id));
  })
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const [session] = await db.delete(workoutSessions).where(eq(workoutSessions.id, id)).returning();
    if (!session) return c.json({ error: "Not found" }, 404);
    return c.json({ success: true });
  });
