import type { Food, MealItem } from "./api";

/** Approximate gram equivalent per unit (for display/calculation only). */
const UNIT_GRAMS: Record<string, number> = {
  g:           1,
  ml:          1,
  unidade:     0,   // uses food.servingSize — see toGrams()
  colher_sopa: 15,
  colher_cha:  5,
  xicara:      200,
};

/** Convert a quantity in a given unit to grams for nutritional calculation. */
export function toGrams(quantity: number, unit: string, food: Pick<Food, "servingSize">): number {
  if (unit === "g" || unit === "ml") return quantity;
  if (unit === "unidade") return quantity * (food.servingSize ?? 100);
  const factor = UNIT_GRAMS[unit];
  return factor != null ? quantity * factor : quantity;
}

/** Macros for a single meal item, unit-aware. */
export function itemMacros(item: Pick<MealItem, "quantity" | "unit"> & { food: Food }) {
  const g = toGrams(item.quantity, item.unit, item.food);
  return {
    kcal: ((item.food.caloriesPer100g ?? 0) * g) / 100,
    prot: ((item.food.proteinPer100g  ?? 0) * g) / 100,
    carb: ((item.food.carbsPer100g    ?? 0) * g) / 100,
    fat:  ((item.food.fatPer100g      ?? 0) * g) / 100,
  };
}

/** Display label for a unit + quantity combo. */
export function formatQuantity(quantity: number, unit: string): string {
  if (unit === "g" || unit === "ml") return `${quantity}${unit}`;
  return `${quantity} ${unit}`;
}
