"use client";

import { useEffect, useState } from "react";
import { api, type Meal } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Play, Plus, Layers } from "lucide-react";
import { NewMealDialog } from "./new-meal-dialog";

function calcKcal(meal: Meal) {
  return (meal.items ?? []).reduce((s, i) => s + ((i.food.caloriesPer100g ?? 0) * i.quantity) / 100, 0);
}
function calcProt(meal: Meal) {
  return (meal.items ?? []).reduce((s, i) => s + ((i.food.proteinPer100g ?? 0) * i.quantity) / 100, 0);
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    <span style={{ fontSize: 9.5, color: "var(--oh-fg-4)", letterSpacing: "0.1em", fontFamily: "var(--font-geist-mono)" }}>{label}</span>
  </div>
);

export function MealTemplates() {
  const [templates, setTemplates] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | undefined>();

  async function load() {
    setLoading(true);
    try {
      const data = await api.meals.list({ templates: true });
      const withItems = await Promise.all(data.map(m => api.meals.get(m.id)));
      setTemplates(withItems);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleLog(id: number) {
    setLoggingId(id);
    try { await api.meals.logFromTemplate(id); }
    finally { setLoggingId(null); }
  }

  const Btn = ({ onClick, children, variant = "secondary" }: { onClick: () => void; children: React.ReactNode; variant?: "primary" | "secondary" }) => (
    <button onClick={onClick} style={{
      flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "6px 10px", fontSize: 12, fontWeight: 500, borderRadius: 10, cursor: "pointer",
      fontFamily: "var(--font-geist-sans)", transition: "all 0.15s",
      ...(variant === "primary"
        ? { background: "var(--oh-accent)", color: "var(--oh-accent-fg)", border: "1px solid var(--oh-accent)", boxShadow: "0 1px 0 oklch(1 0 0 / 0.15) inset" }
        : { background: "var(--oh-bg-3)", color: "var(--oh-fg)", border: "1px solid var(--oh-border)" }
      ),
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      {children}
    </button>
  );

  return (
    <>
      <NewMealDialog open={showDialog} onClose={() => setShowDialog(false)} onSaved={load} defaultTemplate={true} editMeal={editMeal} />

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-[16px]" style={{ background: "var(--oh-bg-3)" }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div style={{
          padding: 48, borderRadius: 16, border: "1px dashed var(--oh-border-strong)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--oh-fg-3)",
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--oh-bg-3)", display: "grid", placeItems: "center" }}>
            <Layers size={18} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--oh-fg)" }}>Nenhuma refeição salva</div>
          <div style={{ fontSize: 12.5, color: "var(--oh-fg-3)" }}>Salve refeições frequentes para registrar com um clique.</div>
          <button onClick={() => { setEditMeal(undefined); setShowDialog(true); }} style={{
            marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 14px", fontSize: 13, fontWeight: 500, borderRadius: 10, cursor: "pointer",
            background: "var(--oh-bg-3)", color: "var(--oh-fg)", border: "1px solid var(--oh-border-strong)",
            fontFamily: "var(--font-geist-sans)",
          }}>
            <Plus size={14} /> Nova refeição
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {templates.map(m => (
            <div key={m.id} className="oh-fade-in oh-glass" style={{
              padding: 18, borderRadius: 16, display: "flex", flexDirection: "column", gap: 14,
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--oh-border-strong)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--oh-border)"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--oh-fg)" }}>{m.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>{(m.items ?? []).length} item(ns) salvos</span>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)", display: "grid", placeItems: "center", color: "var(--oh-fg-2)", flexShrink: 0 }}>
                  <Layers size={15} />
                </div>
              </div>

              <div style={{
                display: "flex", gap: 8, padding: "10px 12px",
                background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)",
                borderRadius: 10, fontFamily: "var(--font-geist-mono)",
              }}>
                <Stat label="KCAL" value={Math.round(calcKcal(m))} />
                <div style={{ width: 1, background: "var(--oh-border)" }} />
                <Stat label="PROT" value={`${calcProt(m).toFixed(1)}g`} />
                <div style={{ width: 1, background: "var(--oh-border)" }} />
                <Stat label="ITENS" value={(m.items ?? []).length} />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={() => { setEditMeal(m); setShowDialog(true); }}><Copy size={12} /> Editar</Btn>
                <Btn variant="primary" onClick={() => handleLog(m.id)}>
                  {loggingId === m.id ? "…" : <><Play size={12} /> Registrar</>}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
