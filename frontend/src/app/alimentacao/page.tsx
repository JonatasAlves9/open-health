"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { MealLog } from "@/components/alimentacao/meal-log";
import { MealTemplates } from "@/components/alimentacao/meal-templates";
import { FoodSearch } from "@/components/alimentacao/food-search";
import { NewMealDialog } from "@/components/alimentacao/new-meal-dialog";

const TABS = [
  { id: "hoje", label: "Hoje" },
  { id: "salvas", label: "Refeições salvas" },
  { id: "alimentos", label: "Alimentos" },
];

export default function AlimentacaoPage() {
  const [tab, setTab] = useState("hoje");
  const [showDialog, setShowDialog] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const idx = TABS.findIndex(t => t.id === tab);
    const el = tabRefs.current[idx];
    if (el) setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  return (
    <>
      <NewMealDialog open={showDialog} onClose={() => setShowDialog(false)} onSaved={() => {}} defaultTemplate={false} />

      {/* Page Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 11.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Nutrição · Hoje
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--oh-fg)", margin: 0, lineHeight: 1.15 }}>
            Alimentação
          </h1>
          <p style={{ fontSize: 13, color: "var(--oh-fg-3)", margin: 0, marginTop: 2 }}>
            Registre e acompanhe suas refeições em tempo real.
          </p>
        </div>
        {tab === "hoje" && (
          <button
            onClick={() => setShowDialog(true)}
            className="oh-fade-in"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 18px", borderRadius: 12,
              background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
              border: "1px solid var(--oh-accent)", cursor: "pointer",
              fontFamily: "var(--font-geist-sans)", fontSize: 13.5, fontWeight: 600,
              boxShadow: "0 1px 0 oklch(1 0 0 / 0.15) inset, var(--oh-shadow-sm)",
              transition: "all 0.15s", flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.06)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
          >
            <Plus size={15} /> Nova refeição
          </button>
        )}
      </div>

      {/* Custom Tabs */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: "relative", display: "inline-flex", gap: 0, padding: "4px", borderRadius: 14, background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)" }}>
          {/* Sliding indicator */}
          <div style={{
            position: "absolute", top: 4, bottom: 4,
            left: indicatorStyle.left, width: indicatorStyle.width,
            background: "var(--oh-surface)", border: "1px solid var(--oh-border-strong)",
            borderRadius: 10, transition: "left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: "var(--oh-shadow-sm)",
          }} />
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={el => { tabRefs.current[i] = el; }}
              onClick={() => setTab(t.id)}
              style={{
                position: "relative", zIndex: 1,
                padding: "7px 16px", borderRadius: 10, border: "none",
                background: "transparent", cursor: "pointer",
                fontFamily: "var(--font-geist-sans)", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? "var(--oh-fg)" : "var(--oh-fg-3)",
                transition: "color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === "hoje" && <MealLog onNewMeal={() => setShowDialog(true)} />}
        {tab === "salvas" && <MealTemplates />}
        {tab === "alimentos" && <FoodSearch />}
      </div>
    </>
  );
}
