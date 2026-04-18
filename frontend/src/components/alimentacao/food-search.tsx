"use client";

import { useState } from "react";
import { api, type Food } from "@/lib/api";
import { Search, Plus, Filter, Pencil } from "lucide-react";
import { FoodFormDialog } from "./food-form-dialog";

const SOURCE_COLOR: Record<string, string> = {
  taco: "oklch(0.4 0.08 155 / 0.2)",
  open_food_facts: "oklch(0.4 0.08 230 / 0.2)",
  manual: "var(--oh-bg-3)",
};
const SOURCE_FG: Record<string, string> = {
  taco: "oklch(0.85 0.14 155)",
  open_food_facts: "oklch(0.85 0.14 230)",
  manual: "var(--oh-fg-3)",
};
const SOURCE_BORDER: Record<string, string> = {
  taco: "oklch(0.6 0.14 155 / 0.3)",
  open_food_facts: "oklch(0.6 0.14 230 / 0.3)",
  manual: "var(--oh-border)",
};
const SOURCE_LABEL: Record<string, string> = { taco: "TACO", open_food_facts: "OFF", manual: "Manual" };

const FOOD_ICONS: Record<string, string> = {
  protein: "🥩", grain: "🌾", vegetable: "🥦", fruit: "🍎",
  dairy: "🥛", fat: "🫒", supplement: "💊",
};

export function FoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editFood, setEditFood] = useState<Food | undefined>();

  async function handleSearch(q = query) {
    if (!q.trim()) return;
    setSearching(true); setSearched(true);
    try { setResults(await api.foods.list(q)); }
    finally { setSearching(false); }
  }

  return (
    <>
      <FoodFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={() => handleSearch()} editFood={editFood} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Search bar */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--oh-fg-4)" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Buscar na base TACO…"
              style={{
                width: "100%", padding: "12px 14px 12px 40px",
                background: "var(--oh-surface)", backdropFilter: "blur(12px)",
                border: "1px solid var(--oh-border)", borderRadius: 12,
                color: "var(--oh-fg)", fontSize: 13.5, outline: "none",
                fontFamily: "var(--font-geist-sans)", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--oh-border-strong)")}
              onBlur={e => (e.target.style.borderColor = "var(--oh-border)")}
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "var(--oh-bg-3)", border: "none", borderRadius: 6,
                width: 22, height: 22, display: "grid", placeItems: "center",
                cursor: "pointer", color: "var(--oh-fg-3)", fontSize: 11,
              }}>✕</button>
            )}
          </div>
          <button onClick={() => handleSearch()} disabled={searching} style={{
            padding: "12px 16px", borderRadius: 12, border: "1px solid var(--oh-border-strong)",
            background: "transparent", color: "var(--oh-fg)", cursor: "pointer", fontFamily: "var(--font-geist-sans)",
            fontSize: 13, fontWeight: 500, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <Filter size={14} /> Filtros
          </button>
          <button onClick={() => { setEditFood(undefined); setFormOpen(true); }} style={{
            padding: "12px 16px", borderRadius: 12,
            background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
            border: "1px solid var(--oh-accent)", cursor: "pointer", fontFamily: "var(--font-geist-sans)",
            fontSize: 13, fontWeight: 500, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6,
            boxShadow: "0 1px 0 oklch(1 0 0 / 0.15) inset",
          }}>
            <Plus size={14} /> Cadastrar
          </button>
        </div>

        {/* Empty / initial */}
        {!searched && (
          <div style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "var(--oh-fg-3)" }}>
            <Search size={32} style={{ opacity: 0.2 }} />
            <div style={{ fontSize: 13.5 }}>Digite para buscar alimentos no catálogo</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>TACO · Open Food Facts · Seus cadastros</div>
          </div>
        )}

        {/* Loading */}
        {searching && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 68, borderRadius: 14, background: "var(--oh-bg-3)", animation: "pulse 1.5s ease infinite" }} />
            ))}
          </div>
        )}

        {/* No results */}
        {searched && !searching && results.length === 0 && (
          <div style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: "var(--oh-fg-3)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--oh-bg-3)", display: "grid", placeItems: "center" }}>
              <Search size={18} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--oh-fg)" }}>Nenhum alimento encontrado</div>
            <div style={{ fontSize: 12.5 }}>Sem resultados para "{query}".</div>
            <button onClick={() => { setEditFood(undefined); setFormOpen(true); }} style={{
              marginTop: 4, padding: "7px 14px", fontSize: 13, fontWeight: 500, borderRadius: 10,
              background: "var(--oh-bg-3)", color: "var(--oh-fg)", border: "1px solid var(--oh-border-strong)",
              cursor: "pointer", fontFamily: "var(--font-geist-sans)", display: "inline-flex", alignItems: "center", gap: 6,
            }}><Plus size={14} /> Cadastrar manualmente</button>
          </div>
        )}

        {/* Results grid */}
        {!searching && results.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 10 }}>
            {results.map((f, i) => (
              <div key={f.id === -1 ? `off-${i}` : f.id} className="oh-fade-in" style={{
                padding: "14px 16px", background: "var(--oh-surface)", backdropFilter: "blur(14px)",
                border: "1px solid var(--oh-border)", borderRadius: 14,
                display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.18s", cursor: "pointer",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--oh-border-strong)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--oh-border)"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--oh-bg-3)", display: "grid", placeItems: "center", fontSize: 18, flexShrink: 0 }}>
                  {FOOD_ICONS["protein"] || "🥗"}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--oh-fg)" }}>{f.name}</span>
                    <span style={{
                      padding: "2px 7px", borderRadius: 6, fontSize: 10.5, fontWeight: 500,
                      fontFamily: "var(--font-geist-mono)", letterSpacing: "0.04em",
                      background: SOURCE_COLOR[f.source] ?? "var(--oh-bg-3)",
                      color: SOURCE_FG[f.source] ?? "var(--oh-fg-3)",
                      border: `1px solid ${SOURCE_BORDER[f.source] ?? "var(--oh-border)"}`,
                    }}>{SOURCE_LABEL[f.source] ?? f.source}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {f.caloriesPer100g != null && <span><span style={{ color: "var(--oh-fg-2)" }}>{f.caloriesPer100g}</span> kcal/100g</span>}
                    {f.proteinPer100g != null && <span><span style={{ color: "var(--oh-protein)" }}>{f.proteinPer100g}</span>g prot</span>}
                    {f.carbsPer100g != null && <span><span style={{ color: "var(--oh-carbs)" }}>{f.carbsPer100g}</span>g carb</span>}
                    {f.fatPer100g != null && <span><span style={{ color: "var(--oh-fat)" }}>{f.fatPer100g}</span>g gord</span>}
                  </div>
                </div>
                <button onClick={() => { setEditFood(f); setFormOpen(true); }} style={{
                  width: 28, height: 28, display: "grid", placeItems: "center", flexShrink: 0,
                  border: "1px solid var(--oh-border)", borderRadius: 9,
                  background: "transparent", color: "var(--oh-fg-3)", cursor: "pointer",
                }}>
                  <Pencil size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
