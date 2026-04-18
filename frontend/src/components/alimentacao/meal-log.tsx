"use client";

import { useEffect, useState, useMemo } from "react";
import { api, type Meal } from "@/lib/api";
import { itemMacros } from "@/lib/nutrition";
import { Skeleton } from "@/components/ui/skeleton";
import { Utensils } from "lucide-react";
import { MealCard } from "./meal-card";
import { DaySummary } from "./day-summary";
import { NewMealDialog } from "./new-meal-dialog";

function todayISO() { return new Date().toISOString().split("T")[0]; }

function calcMacros(meal: Meal) {
  return (meal.items ?? []).reduce(
    (acc, item) => {
      const m = itemMacros(item);
      return { kcal: acc.kcal + m.kcal, prot: acc.prot + m.prot, carb: acc.carb + m.carb, fat: acc.fat + m.fat };
    },
    { kcal: 0, prot: 0, carb: 0, fat: 0 }
  );
}

export function MealLog({ onNewMeal }: { onNewMeal?: () => void }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | undefined>();

  async function load() {
    setLoading(true);
    try {
      const data = await api.meals.list({ date: todayISO() });
      const withItems = await Promise.all(data.map(m => api.meals.get(m.id)));
      setMeals(withItems);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const dayTotals = useMemo(() =>
    meals.reduce((acc, m) => { const t = calcMacros(m); return { kcal: acc.kcal + t.kcal, prot: acc.prot + t.prot, carb: acc.carb + t.carb, fat: acc.fat + t.fat }; }, { kcal: 0, prot: 0, carb: 0, fat: 0 }),
    [meals]
  );

  return (
    <>
      <NewMealDialog open={showDialog} onClose={() => setShowDialog(false)} onSaved={load} defaultTemplate={false} editMeal={editMeal} />

      {/* Day Summary */}
      {loading ? (
        <div style={{ marginTop: 20 }}>
          <Skeleton className="h-[188px] w-full rounded-[20px]" style={{ background: "var(--oh-bg-3)" }} />
        </div>
      ) : (
        <DaySummary totals={dayTotals} meals={meals} />
      )}

      {/* Meals list */}
      {loading ? (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-[16px]" style={{ background: "var(--oh-bg-3)" }} />)}
        </div>
      ) : meals.length === 0 ? (
        <div style={{
          marginTop: 18, padding: 48, borderRadius: 16,
          border: "1px dashed var(--oh-border-strong)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          color: "var(--oh-fg-3)",
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--oh-bg-3)", display: "grid", placeItems: "center" }}>
            <Utensils size={18} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--oh-fg)" }}>Nada registrado ainda</div>
          <div style={{ fontSize: 12.5, color: "var(--oh-fg-3)" }}>Crie sua primeira refeição para começar a rastrear.</div>
        </div>
      ) : (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onEdit={m => { setEditMeal(m); setShowDialog(true); }}
              onRemove={async id => { await api.meals.delete(id); setMeals(p => p.filter(m => m.id !== id)); }}
            />
          ))}
        </div>
      )}
    </>
  );
}
