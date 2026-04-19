const API = "";

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

export type DailyNutrition = {
  date: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  meals: number;
};

export type Exercise = {
  id: number;
  name: string;
  namePt: string | null;
  muscleGroup: string;
  equipment: string | null;
  wgerId: number | null;
  gifUrl: string | null;
  description: string | null;
  source: string;
  createdAt: string;
};

export type WorkoutSet = {
  id: number;
  sessionId: number;
  exerciseId: number;
  exercise: Exercise;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  rpe: number | null;
  notes: string | null;
};

export type CardioEntry = {
  id: number;
  sessionId: number;
  exerciseId: number | null;
  exercise: Exercise | null;
  modality: "corrida" | "caminhada" | "bike" | "natacao" | "outro";
  durationMin: number;
  distanceKm: number | null;
  intensity: "leve" | "moderada" | "intensa";
  kcalBurned: number | null;
  notes: string | null;
};

export type WorkoutSession = {
  id: number;
  name: string;
  isTemplate: boolean;
  loggedAt: string | null;
  notes: string | null;
  kcalBurned: number | null;
  bodyWeightKg: number | null;
  templateId: number | null;
  createdAt: string;
  sets?: WorkoutSet[];
  cardio?: CardioEntry[];
};

export type DailyWorkout = {
  date: string;
  sessions: number;
  kcal: number;
};

export type WorkoutProgression = {
  date: string;
  maxWeight: number | null;
  maxReps: number | null;
  totalVolume: number;
  totalSets: number;
  orm: number | null;
};

export const api = {
  nutrition: {
    daily: (params: { from: string; to: string }) =>
      request<DailyNutrition[]>(`/api/nutrition/daily?from=${params.from}&to=${params.to}`),
  },
  settings: {
    get: () => request<Record<string, unknown>>("/api/settings"),
    put: (key: string, value: unknown) =>
      request<{ key: string; value: unknown }>(`/api/settings/${key}`, {
        method: "PUT", body: JSON.stringify(value),
      }),
  },
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
  exercises: {
    list: (params?: { q?: string; group?: string }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set("q", params.q);
      if (params?.group) qs.set("group", params.group);
      return request<Exercise[]>(`/api/exercises${qs.toString() ? `?${qs}` : ""}`);
    },
    create: (data: { name: string; muscleGroup?: string; equipment?: string; description?: string }) =>
      request<Exercise>("/api/exercises", { method: "POST", body: JSON.stringify(data) }),
    cacheWger: (data: { wgerId: number; name: string; muscleGroup?: string; equipment?: string }) =>
      request<Exercise>("/api/exercises/cache-wger", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; muscleGroup: string; equipment: string; description: string }>) =>
      request<Exercise>(`/api/exercises/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  workouts: {
    list: (params?: { date?: string; templates?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.date) qs.set("date", params.date);
      if (params?.templates) qs.set("templates", "true");
      return request<WorkoutSession[]>(`/api/workouts${qs.toString() ? `?${qs}` : ""}`);
    },
    get: (id: number) => request<WorkoutSession>(`/api/workouts/${id}`),
    create: (data: {
      name: string;
      isTemplate?: boolean;
      loggedAt?: string;
      notes?: string;
      bodyWeightKg?: number;
      templateId?: number;
      sets?: { exerciseId: number; setNumber: number; reps?: number; weightKg?: number; rpe?: number; notes?: string }[];
      cardio?: { exerciseId?: number; modality?: string; durationMin: number; distanceKm?: number; intensity?: string; notes?: string }[];
    }) => request<WorkoutSession>("/api/workouts", { method: "POST", body: JSON.stringify(data) }),
    logFromTemplate: (id: number) =>
      request<WorkoutSession>(`/api/workouts/${id}/log`, { method: "POST" }),
    update: (id: number, data: {
      name?: string; isTemplate?: boolean; loggedAt?: string; notes?: string;
      bodyWeightKg?: number; templateId?: number;
      sets?: { exerciseId: number; setNumber: number; reps?: number; weightKg?: number; rpe?: number; notes?: string }[];
      cardio?: { exerciseId?: number; modality?: string; durationMin: number; distanceKm?: number; intensity?: string; notes?: string }[];
    }) =>
      request<WorkoutSession>(`/api/workouts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/api/workouts/${id}`, { method: "DELETE" }),
    daily: (params: { from: string; to: string }) =>
      request<DailyWorkout[]>(`/api/workouts/daily?from=${params.from}&to=${params.to}`),
    progression: (exerciseId: number) =>
      request<WorkoutProgression[]>(`/api/workouts/progression/${exerciseId}`),
  },
};
