"use client";

import { MacroRing } from "./macro-ring";
import type { Meal } from "@/lib/api";

type Macros = { kcal: number; prot: number; carb: number; fat: number };
type Targets = { kcal: number; prot: number; carb: number; fat: number };

function MacroBar({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) {
  const pct = Math.min((consumed / (target || 1)) * 100, 100);
  const over = consumed > target;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: color, boxShadow: `0 0 8px ${color}`, display: "inline-block" }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--oh-fg-2)" }}>{label}</span>
        </div>
        <span style={{ fontSize: 11.5, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: over ? "var(--oh-danger)" : "var(--oh-fg)" }}>{Math.round(consumed)}</span>
          <span style={{ color: "var(--oh-fg-4)" }}> / {target}g</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: "var(--oh-bg-3)", overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", inset: 0, width: `${pct}%`,
          background: color, borderRadius: 6,
          boxShadow: `0 0 10px ${color}`,
          transition: "width 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
        }} />
      </div>
    </div>
  );
}

function DayTimeline({ meals }: { meals: Meal[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const byHour = new Set(meals.map(m => {
    if (!m.loggedAt) return -1;
    return new Date(m.loggedAt).getHours();
  }));
  const nowH = new Date().getHours();
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Linha do dia</span>
        <span style={{ fontSize: 11, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)" }}>{today}</span>
      </div>
      <div style={{ display: "flex", gap: 2.5, alignItems: "end", height: 28 }}>
        {hours.map(h => {
          const active = byHour.has(h);
          const isNow = h === nowH;
          return (
            <div key={h} style={{
              flex: 1,
              height: active ? 22 : h % 6 === 0 ? 10 : 4,
              borderRadius: 2,
              background: active ? "var(--oh-fg)" : isNow ? "var(--oh-accent)" : "var(--oh-border-strong)",
              opacity: active ? 1 : h % 6 === 0 ? 0.6 : 0.4,
              transition: "all 0.3s",
            }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
        <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
      </div>
    </div>
  );
}

export function DaySummary({ totals, meals, targets }: { totals: Macros; meals: Meal[]; targets: Targets }) {
  const remaining = Math.max(0, Math.round(targets.kcal - totals.kcal));
  return (
    <div className="oh-glass oh-fade-in" style={{
      marginTop: 20, padding: "20px 22px", borderRadius: 20,
      boxShadow: "var(--oh-shadow-sm)",
    }}>
      {/* Desktop: 3-col grid; Mobile: stacked */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
        gap: 24,
        alignItems: "center",
      }}>
        {/* Ring */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <MacroRing consumed={totals.kcal} target={targets.kcal} size={148} stroke={11} />
          <div style={{ fontSize: 11, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}>
            {remaining} kcal restantes
          </div>
        </div>

        {/* Macro bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--oh-fg)" }}>Macronutrientes</span>
            <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Meta diária</span>
          </div>
          <MacroBar label="Proteína"    consumed={totals.prot} target={targets.prot} color="var(--oh-protein)" />
          <MacroBar label="Carboidrato" consumed={totals.carb} target={targets.carb} color="var(--oh-carbs)" />
          <MacroBar label="Gordura"     consumed={totals.fat}  target={targets.fat}  color="var(--oh-fat)" />
        </div>

        {/* Timeline */}
        <div style={{ minWidth: 0 }}>
          <DayTimeline meals={meals} />
        </div>
      </div>
    </div>
  );
}
