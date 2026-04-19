import { db } from "../db/index.js";
import { exercises } from "../db/schema.js";
import { eq } from "drizzle-orm";

const WORD_MAP: [RegExp, string][] = (
  [
    // Full exercise names (most specific first)
    ["alternating", "alternado"],
    ["alternate", "alternado"],
    ["advanced", "avançado"],
    ["basic", "básico"],
    ["all fours", "quatro apoios"],
    ["abdominals", "abdômen"],
    ["abdominal", "abdominal"],
    ["dumbbell alternating", "haltere alternado"],
    ["barbell curl", "rosca direta com barra"],
    ["dumbbell curl", "rosca direta com haltere"],
    ["hammer curl", "rosca martelo"],
    ["preacher curl", "rosca scott"],
    ["incline dumbbell curl", "rosca inclinada com haltere"],
    ["concentration curl", "rosca concentrada"],
    ["cable curl", "rosca no cabo"],
    ["reverse curl", "rosca inversa"],
    ["barbell row", "remada com barra"],
    ["dumbbell row", "remada com haltere"],
    ["seated row", "remada sentado"],
    ["cable row", "remada no cabo"],
    ["bent over row", "remada curvada"],
    ["t-bar row", "remada cavalinho"],
    ["upright row", "remada alta"],
    ["incline bench press", "supino inclinado"],
    ["decline bench press", "supino declinado"],
    ["bench press", "supino reto"],
    ["overhead press", "desenvolvimento"],
    ["shoulder press", "desenvolvimento ombro"],
    ["military press", "desenvolvimento militar"],
    ["arnold press", "desenvolvimento arnold"],
    ["leg press", "leg press"],
    ["chest press", "supino na máquina"],
    ["calf press", "panturrilha no leg press"],
    ["leg extension", "extensão de pernas"],
    ["leg curl", "flexão de pernas"],
    ["hip extension", "extensão de quadril"],
    ["hip flexion", "flexão de quadril"],
    ["hip abduction", "abdução de quadril"],
    ["hip adduction", "adução de quadril"],
    ["hip thrust", "elevação de quadril"],
    ["good morning", "bom dia"],
    ["lateral raise", "elevação lateral"],
    ["front raise", "elevação frontal"],
    ["rear delt raise", "elevação posterior"],
    ["face pull", "puxada para o rosto"],
    ["pull-up", "barra fixa"],
    ["pull up", "barra fixa"],
    ["chin-up", "barra supinada"],
    ["chin up", "barra supinada"],
    ["push-up", "flexão de braço"],
    ["push up", "flexão de braço"],
    ["push down", "tríceps no cabo"],
    ["pushdown", "tríceps no cabo"],
    ["skull crusher", "tríceps testa"],
    ["tricep dip", "tríceps no banco"],
    ["dip", "mergulho"],
    ["plank", "prancha"],
    ["sit-up", "abdominal completo"],
    ["sit up", "abdominal completo"],
    ["russian twist", "torção russa"],
    ["mountain climber", "escalador"],
    ["burpee", "burpee"],
    ["jumping jack", "polichinelo"],
    ["high knee", "joelho alto"],
    ["box jump", "salto na caixa"],
    ["jump squat", "agachamento com salto"],
    ["jump lunge", "avanço com salto"],
    ["goblet squat", "agachamento goblet"],
    ["sumo squat", "agachamento sumô"],
    ["squat", "agachamento"],
    ["reverse lunge", "avanço reverso"],
    ["walking lunge", "avanço caminhando"],
    ["lunge", "avanço"],
    ["step up", "subida no banco"],
    ["romanian deadlift", "levantamento terra romeno"],
    ["sumo deadlift", "levantamento terra sumô"],
    ["stiff leg deadlift", "levantamento terra stiff"],
    ["deadlifts", "levantamento terra"],
    ["deadlift", "levantamento terra"],
    ["glute bridge", "ponte de glúteo"],
    ["hip raise", "elevação de quadril"],
    ["shrug", "encolhimento de ombros"],
    ["wrist curl", "rosca de punho"],
    ["calf raise", "elevação de panturrilha em pé"],
    ["seated calf raise", "elevação de panturrilha sentado"],
    ["donkey calf raise", "elevação de panturrilha no burro"],
    ["cable crossover", "crucifixo no cabo"],
    ["dumbbell fly", "crucifixo com haltere"],
    ["cable fly", "crucifixo no cabo"],
    ["pec deck", "peck deck"],
    ["chest fly", "crucifixo"],
    ["lat pulldown", "puxada frontal"],
    ["pulldown", "puxada"],
    ["pullover", "pullover"],
    ["pull over", "pullover"],
    ["tricep extension", "extensão de tríceps"],
    ["overhead tricep extension", "extensão de tríceps acima da cabeça"],
    ["tricep kickback", "coice de tríceps"],
    ["glute kickback", "coice de glúteo"],
    ["fire hydrant", "abdução lateral de quadril"],
    ["bird dog", "bird dog"],
    ["dead bug", "inseto morto"],
    ["superman", "superman"],
    ["pallof press", "pressão pallof"],
    ["wood chop", "corte de lenha"],
    ["woodchop", "corte de lenha"],
    ["kettlebell swing", "swing com kettlebell"],
    ["turkish get-up", "turkish get-up"],
    ["turkish get up", "turkish get-up"],
    ["around the world", "ao redor do mundo"],
    ["hyperextension", "hiperextensão"],
    ["back extension", "extensão de costas"],
    ["reverse hyper", "hiperextensão reversa"],
    ["foam roll", "foam roller"],
    // Equipment
    ["with barbell", "com barra"],
    ["with dumbbell", "com haltere"],
    ["with kettlebell", "com kettlebell"],
    ["with cable", "no cabo"],
    ["with band", "com elástico"],
    ["with medicine ball", "com medicine ball"],
    ["on machine", "na máquina"],
    // Adjectives/positions
    ["close grip", "pegada fechada"],
    ["wide grip", "pegada aberta"],
    ["neutral grip", "pegada neutra"],
    ["reverse grip", "pegada inversa"],
    ["underhand grip", "pegada supinada"],
    ["overhand grip", "pegada pronada"],
    ["single arm", "unilateral"],
    ["single leg", "unilateral"],
    ["one arm", "um braço"],
    ["one leg", "uma perna"],
    ["standing", "em pé"],
    ["seated", "sentado"],
    ["lying", "deitado"],
    ["incline", "inclinado"],
    ["decline", "declinado"],
    ["flat", "plano"],
    ["upper", "superior"],
    ["lower", "inferior"],
    ["middle", "médio"],
    ["lateral", "lateral"],
    ["front", "frontal"],
    ["rear", "posterior"],
    ["reverse", "reverso"],
    ["overhead", "acima da cabeça"],
    ["sumo", "sumô"],
    ["romanian", "romeno"],
    ["nordic", "nórdico"],
    // Body parts
    ["bicep", "bíceps"],
    ["biceps", "bíceps"],
    ["tricep", "tríceps"],
    ["triceps", "tríceps"],
    ["forearm", "antebraço"],
    ["wrist", "pulso"],
    ["chest", "peito"],
    ["shoulder", "ombro"],
    ["back", "costas"],
    ["abdominals", "abdômen"],
    ["abdominal", "abdominal"],
    ["oblique", "oblíquo"],
    ["glute", "glúteo"],
    ["hamstring", "posterior de coxa"],
    ["quadricep", "quadríceps"],
    ["calf", "panturrilha"],
    ["calves", "panturrilhas"],
    ["neck", "pescoço"],
    ["hip", "quadril"],
    ["core", "core"],
    ["trap", "trapézio"],
    ["traps", "trapézio"],
    // Equipment (standalone)
    ["barbell", "barra"],
    ["dumbbell", "haltere"],
    ["kettlebell", "kettlebell"],
    ["cable", "cabo"],
    ["machine", "máquina"],
    ["band", "elástico"],
    ["rope", "corda"],
    // Movements (generic, last resort)
    ["curl", "rosca"],
    ["row", "remada"],
    ["press", "desenvolvimento"],
    ["raise", "elevação"],
    ["fly", "crucifixo"],
    ["extension", "extensão"],
    ["flexion", "flexão"],
    ["kickback", "coice"],
    ["crunch", "abdominal"],
    ["rotation", "rotação"],
    ["twist", "torção"],
    ["swing", "balanço"],
    ["push", "empurrar"],
    ["pull", "puxar"],
    ["lift", "levantamento"],
    ["jump", "salto"],
    ["stretch", "alongamento"],
    // Articles/prepositions to drop or convert
    ["\\bthe\\b", ""],
    ["\\bwith\\b", "com"],
    ["\\bon\\b", "no"],
    ["\\band\\b", "e"],
    ["\\bof\\b", "de"],
    ["\\bto\\b", "para"],
    ["\\bin\\b", "em"],
    ["\\ba\\b", ""],
    ["\\ban\\b", ""],
  ] as [string, string][]
).map(([en, pt]) => [
  new RegExp(`(?<![a-zA-ZÀ-ú])${en.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-zA-ZÀ-ú])`, "gi"),
  pt,
]);

function translateName(name: string): string {
  let result = name;
  for (const [pattern, pt] of WORD_MAP) {
    result = result.replace(pattern, pt);
  }
  // Clean up multiple spaces
  result = result.replace(/\s+/g, " ").trim();
  // Remove leading/trailing " -" artifacts
  result = result.replace(/^[-\s]+|[-\s]+$/g, "").trim();
  if (result.length < 2) return name;
  return result.charAt(0).toUpperCase() + result.slice(1);
}

async function main() {
  const all = await db.select({ id: exercises.id, name: exercises.name }).from(exercises);
  console.log(`Traduzindo ${all.length} exercícios...`);

  let count = 0;
  for (const ex of all) {
    const namePt = translateName(ex.name);
    await db.update(exercises).set({ namePt }).where(eq(exercises.id, ex.id));
    count++;
    if (count % 50 === 0) process.stdout.write(`\r  ${count}/${all.length}`);
  }

  console.log(`\n\n✅ ${count} exercícios traduzidos!`);
  console.log("\nAmostras:");
  for (const ex of all.slice(0, 15)) {
    console.log(`  "${ex.name}" → "${translateName(ex.name)}"`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
