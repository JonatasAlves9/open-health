const FOOD_NUM_FIELDS = [
  "caloriesPer100g",
  "proteinPer100g",
  "carbsPer100g",
  "fatPer100g",
  "fiberPer100g",
  "servingSize",
] as const;

export function roundFood<T extends Record<string, unknown>>(food: T): T {
  const out = { ...food };
  for (const field of FOOD_NUM_FIELDS) {
    if (typeof out[field] === "number") {
      (out as Record<string, unknown>)[field] = Math.round((out[field] as number) * 10) / 10;
    }
  }
  return out;
}

export function roundFoods<T extends Record<string, unknown>>(foods: T[]): T[] {
  return foods.map(roundFood);
}
