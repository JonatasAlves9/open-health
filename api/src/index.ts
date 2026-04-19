import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { runMigrations } from "./db/migrate.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

runMigrations();
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { mealsRouter } from "./routes/meals.js";
import { foodsRouter } from "./routes/foods.js";
import { nutritionRouter } from "./routes/nutrition.js";
import { settingsRouter } from "./routes/settings.js";
import { exercisesRouter } from "./routes/exercises.js";
import { workoutsRouter } from "./routes/workouts.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/foods", foodsRouter);
app.route("/api/meals", mealsRouter);
app.route("/api/nutrition", nutritionRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/exercises", exercisesRouter);
app.route("/api/workouts", workoutsRouter);

// Serve exercise images — tenta data/exercise-images (cópia local), fallback para free-exercise-db/exercises
const IMAGES_DIR_LOCAL = join(__dirname, "../data/exercise-images");
const IMAGES_DIR_REPO  = join(__dirname, "../../free-exercise-db/exercises");
const IMAGES_DIR = existsSync(IMAGES_DIR_LOCAL + "/3_4_Sit-Up") ? IMAGES_DIR_LOCAL : IMAGES_DIR_REPO;
app.get("/api/exercise-images/:folder/:file", async (c) => {
  const folder = c.req.param("folder");
  const file = c.req.param("file");
  // Sanitize to prevent path traversal
  if (folder.includes("..") || file.includes("..")) return c.notFound();
  const filePath = join(IMAGES_DIR, folder, file);
  try {
    const { readFile } = await import("fs/promises");
    const data = await readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": file.endsWith(".jpg") ? "image/jpeg" : "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return c.notFound();
  }
});

const port = Number(process.env.PORT ?? 3001);
console.log(`API rodando em http://localhost:${port}`);

serve({ fetch: app.fetch, port });
