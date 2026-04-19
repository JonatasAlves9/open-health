import { db } from "../db/index.js";
import { exercises } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Dev: ../../../free-exercise-db/dist/exercises.json | Prod: ../data/exercises.json (bundled in image)
const EXERCISES_JSON_PROD = join(__dirname, "../../data/exercises.json");
const EXERCISES_JSON_DEV  = join(__dirname, "../../../free-exercise-db/dist/exercises.json");
const EXERCISES_JSON = existsSync(EXERCISES_JSON_PROD) ? EXERCISES_JSON_PROD : EXERCISES_JSON_DEV;
const REPO_DIR = join(__dirname, "../../../free-exercise-db");
const REPO_IMAGES_DIR = join(__dirname, "../../../free-exercise-db/exercises");

const MUSCLE_MAP: Record<string, string> = {
  abdominals: "core", abductors: "pernas", adductors: "pernas",
  biceps: "braços", calves: "pernas", chest: "peito",
  forearms: "braços", glutes: "glúteos", hamstrings: "pernas",
  lats: "costas", "lower back": "costas", "middle back": "costas",
  neck: "outro", quadriceps: "pernas", shoulders: "ombros",
  traps: "costas", triceps: "braços",
};

const EQUIPMENT_MAP: Record<string, string> = {
  "body only": "Peso corporal", barbell: "Barra", dumbbell: "Haltere",
  cable: "Cabo", machine: "Máquina", kettlebells: "Kettlebell",
  bands: "Elástico", "medicine ball": "Medicine ball",
  "exercise ball": "Bola suíça", "foam roll": "Foam roller",
  "e-z curl bar": "Barra W", other: "Outro",
};

type RawExercise = {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  instructions: string[];
  images: string[];
};

async function main() {
  if (!existsSync(REPO_DIR)) {
    console.error(`❌ Repositório não encontrado em: ${REPO_DIR}`);
    console.error("   Clone com: git clone --depth=1 https://github.com/yuhonas/free-exercise-db.git");
    process.exit(1);
  }

  console.log("📖 Lendo exercises.json...");
  const raw = await readFile(EXERCISES_JSON, "utf8");
  const data: RawExercise[] = JSON.parse(raw);
  console.log(`✓ ${data.length} exercícios encontrados`);

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < data.length; i++) {
    const ex = data[i];

    if (i % 100 === 0) {
      process.stdout.write(`\r  Processando ${i + 1}/${data.length}... (${inserted} inseridos, ${updated} atualizados)`);
    }

    const muscleGroup = MUSCLE_MAP[ex.primaryMuscles?.[0]?.toLowerCase() ?? ""] ?? "outro";
    const equipment = EQUIPMENT_MAP[ex.equipment?.toLowerCase() ?? ""] ?? ex.equipment ?? null;
    const description = ex.instructions?.length
      ? ex.instructions.join(" ").slice(0, 1000)
      : null;

    const folderName = ex.images?.[0]?.split("/")?.[0] ?? null;
    // gifUrl points to the API route that serves images from free-exercise-db/exercises/
    const gifUrl = folderName ? `/api/exercise-images/${folderName}` : null;

    const existing = await db.select().from(exercises).where(eq(exercises.name, ex.name)).get();
    if (existing) {
      await db.update(exercises).set({ muscleGroup, equipment, description, gifUrl, source: "free-exercise-db" }).where(eq(exercises.id, existing.id));
      updated++;
    } else {
      await db.insert(exercises).values({ name: ex.name, muscleGroup, equipment, description, gifUrl, source: "free-exercise-db" });
      inserted++;
    }
  }

  console.log(`\n\n✅ Concluído!`);
  console.log(`   Inseridos: ${inserted} | Atualizados: ${updated}`);
  console.log(`   Imagens servidas de: ${REPO_IMAGES_DIR}`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
