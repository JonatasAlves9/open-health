const UNIT_GRAMS: Record<string, number> = {
  g: 1, ml: 1, unidade: 0, colher_sopa: 15, colher_cha: 5, xicara: 200,
};

export function toGrams(quantity: number, unit: string, servingSize: number | null): number {
  if (unit === "g" || unit === "ml") return quantity;
  if (unit === "unidade") return quantity * (servingSize ?? 100);
  const factor = UNIT_GRAMS[unit];
  return factor != null ? quantity * factor : quantity;
}
