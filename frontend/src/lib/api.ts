const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export type Food = {
  id: number; // -1 = resultado do Open Food Facts ainda não salvo localmente
  name: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  fiberPer100g: number | null;
  source: string;
  barcode: string | null;
  defaultUnit: string;
  servingSize: number | null;
};

export type MealItem = {
  id: number;
  mealId: number;
  quantity: number;
  unit: string;
  food: Food;
};

export type Meal = {
  id: number;
  name: string;
  isTemplate: boolean;
  loggedAt: string | null;
  notes: string | null;
  items?: MealItem[];
  createdAt: string;
};

export const api = {
  foods: {
    list: (q?: string) =>
      request<Food[]>(`/api/foods${q ? `?q=${encodeURIComponent(q)}` : ""}`),
    byBarcode: (barcode: string) =>
      request<Food[]>(`/api/foods?barcode=${encodeURIComponent(barcode)}`),
    create: (data: Partial<Food>) =>
      request<Food>("/api/foods", { method: "POST", body: JSON.stringify(data) }),
    importOff: (data: Partial<Food>) =>
      request<Food>("/api/foods/import-off", { method: "POST", body: JSON.stringify(data) }),
  },
  meals: {
    list: (params?: { date?: string; templates?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.date) qs.set("date", params.date);
      if (params?.templates) qs.set("templates", "true");
      return request<Meal[]>(`/api/meals${qs.toString() ? `?${qs}` : ""}`);
    },
    get: (id: number) => request<Meal>(`/api/meals/${id}`),
    create: (data: {
      name: string;
      isTemplate?: boolean;
      loggedAt?: string;
      notes?: string;
      items?: { foodId: number; quantity: number; unit: string }[];
    }) => request<Meal>("/api/meals", { method: "POST", body: JSON.stringify(data) }),
    logFromTemplate: (id: number) =>
      request<Meal>(`/api/meals/${id}/log`, { method: "POST" }),
    update: (
      id: number,
      data: {
        name?: string;
        isTemplate?: boolean;
        loggedAt?: string;
        notes?: string;
        items?: { foodId: number; quantity: number; unit: string }[];
      }
    ) => request<Meal>(`/api/meals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/meals/${id}`, { method: "DELETE" }),
  },
};
