import { db } from "../db/index.js";
import { foods } from "../db/schema.js";
import { eq } from "drizzle-orm";
import tacoData from "../data/taco.json" with { type: "json" };

async function seed() {
  console.log(`Importando ${tacoData.length} alimentos da tabela TACO...`);
  let inserted = 0;
  let skipped = 0;

  for (const item of tacoData) {
    const existing = await db
      .select()
      .from(foods)
      .where(eq(foods.name, item.name))
      .get();

    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(foods).values({
      name: item.name,
      caloriesPer100g: item.kcal,
      proteinPer100g: item.protein,
      carbsPer100g: item.carbs,
      fatPer100g: item.fat,
      fiberPer100g: item.fiber,
      source: "taco",
      defaultUnit: "g",
    });
    inserted++;
  }

  console.log(`Concluído: ${inserted} inseridos, ${skipped} já existiam.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
