import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { runMigrations } from "./db/migrate.js";

runMigrations();
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { mealsRouter } from "./routes/meals.js";
import { foodsRouter } from "./routes/foods.js";
import { nutritionRouter } from "./routes/nutrition.js";
import { settingsRouter } from "./routes/settings.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:3000" }));

app.get("/health", (c) => c.json({ status: "ok" }));

app.route("/api/foods", foodsRouter);
app.route("/api/meals", mealsRouter);
app.route("/api/nutrition", nutritionRouter);
app.route("/api/settings", settingsRouter);

const port = Number(process.env.PORT ?? 3001);
console.log(`API rodando em http://localhost:${port}`);

serve({ fetch: app.fetch, port });
