"use client";

import { useState } from "react";
import { type Meal } from "@/lib/api";
import { itemMacros, formatQuantity } from "@/lib/nutrition";
import { Utensils, Sunrise, Sunset, Apple, Edit2, Trash2, Clock } from "lucide-react";

const MEAL_ICONS: Record<string, React.ElementType> = {
  breakfast: Sunrise, lunch: Utensils, snack: Apple, dinner: Sunset,
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Café", lunch: "Almoço", snack: "Lanche", dinner: "Jantar",
};

function guessMealType(loggedAt: string | null) {
  if (!loggedAt) return "lunch";
  const h = new Date(loggedAt).getHours();
  if (h < 10) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 19) return "snack";
  return "dinner";
}

function calcMacros(meal: Meal) {
  return (meal.items ?? []).reduce(
    (acc, item) => {
      const m = itemMacros(item);
      return { kcal: acc.kcal + m.kcal, prot: acc.prot + m.prot, carb: acc.carb + m.carb, fat: acc.fat + m.fat };
    },
    { kcal: 0, prot: 0, carb: 0, fat: 0 }
  );
}

type Props = { meal: Meal; onEdit: (m: Meal) => void; onRemove: (id: number) => void };

export function MealCard({ meal, onEdit, onRemove }: Props) {
  const [hovered, setHovered] = useState(false);
  const totals = calcMacros(meal);
  const type = guessMealType(meal.loggedAt);
  const MealIcon = MEAL_ICONS[type] ?? Utensils;
  const label = MEAL_LABELS[type] ?? "Refeição";
  const time = meal.loggedAt ? new Date(meal.loggedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div
      className="oh-fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "18px 22px", borderRadius: 16,
        background: "var(--oh-surface)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        border: `1px solid ${hovered ? "var(--oh-border-strong)" : "var(--oh-border)"}`,
        transition: "all 0.2s",
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? "var(--oh-shadow)" : "var(--oh-shadow-sm)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)",
            display: "grid", placeItems: "center", color: "var(--oh-fg-2)",
          }}>
            <MealIcon size={17} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--oh-fg)" }}>{meal.name}</span>
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "2px 7px", background: "var(--oh-bg-3)", color: "var(--oh-fg-2)",
                border: "1px solid var(--oh-border)", borderRadius: 6,
                fontSize: 10.5, fontWeight: 500, fontFamily: "var(--font-geist-mono)", letterSpacing: "0.04em",
              }}>{label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              {time && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={11} /> {time}</span>}
              {time && <span>·</span>}
              <span>{(meal.items ?? []).length} item{(meal.items ?? []).length !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span style={{ color: "var(--oh-fg-2)", fontVariantNumeric: "tabular-nums" }}>{totals.prot.toFixed(1)}g prot</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "var(--oh-fg)" }}>
              {Math.round(totals.kcal).toLocaleString("pt-BR")}
            </div>
            <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: -2 }}>kcal</div>
          </div>
          <div style={{ display: "flex", gap: 6, opacity: hovered ? 1 : 0.35, transition: "opacity 0.2s" }}>
            {[
              { icon: Edit2, action: () => onEdit(meal) },
              { icon: Trash2, action: () => onRemove(meal.id) },
            ].map(({ icon: Icon, action }, i) => (
              <button key={i} onClick={action} style={{
                width: 28, height: 28, display: "grid", placeItems: "center",
                border: "1px solid var(--oh-border)", borderRadius: 9,
                background: "transparent", color: "var(--oh-fg-2)", cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--oh-bg-3)"; (e.currentTarget as HTMLElement).style.color = "var(--oh-fg)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--oh-fg-2)"; }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      {(meal.items ?? []).length > 0 && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--oh-border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {meal.items!.map((item) => {
            const m = itemMacros(item);
            return (
              <div key={item.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto",
                gap: 10, alignItems: "center", padding: "5px 0", fontSize: 13,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: "var(--oh-fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{item.food.name}</div>
                  <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ color: "var(--oh-protein)" }}>{m.prot.toFixed(1)}</span>P ·{" "}
                    <span style={{ color: "var(--oh-carbs)" }}>{m.carb.toFixed(1)}</span>C ·{" "}
                    <span style={{ color: "var(--oh-fat)" }}>{m.fat.toFixed(1)}</span>G
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                  <span style={{
                    padding: "2px 7px", background: "var(--oh-bg-3)", color: "var(--oh-fg-2)",
                    border: "1px solid var(--oh-border)", borderRadius: 6, fontSize: 10.5, fontWeight: 500,
                  }}>{formatQuantity(item.quantity, item.unit)}</span>
                  <span style={{ fontSize: 11.5, color: "var(--oh-fg-3)" }}>{Math.round(m.kcal)} kcal</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
