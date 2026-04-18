"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { api, type Food, type Meal } from "@/lib/api";
import { itemMacros } from "@/lib/nutrition";
import { Search, Trash2, X, Check, ChevronRight } from "lucide-react";

const UNITS = ["g", "ml", "unidade", "colher_sopa", "colher_cha", "xicara"] as const;
const UNIT_OPTS = [
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "unidade", label: "unidade" },
  { value: "colher_sopa", label: "colher de sopa" },
  { value: "colher_cha", label: "colher de chá" },
  { value: "xicara", label: "xícara" },
];

const inputSty: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)",
  borderRadius: 10, color: "var(--oh-fg)", fontSize: 13.5,
  outline: "none", fontFamily: "var(--font-geist-sans)", transition: "border-color 0.15s",
};

type Item = { food: Food; quantity: number; unit: string };
type Props = { open: boolean; onClose: () => void; onSaved: () => void; defaultTemplate?: boolean; editMeal?: Meal };

export function NewMealDialog({ open, onClose, onSaved, defaultTemplate = false, editMeal }: Props) {
  const isEdit = !!editMeal;
  const [name, setName] = useState("");
  const [isTemplate, setIsTemplate] = useState(defaultTemplate);
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (editMeal) {
        setName(editMeal.name);
        setIsTemplate(editMeal.isTemplate);
        setItems((editMeal.items ?? []).map(i => ({ food: i.food, quantity: i.quantity, unit: i.unit })));
      } else {
        setName(""); setIsTemplate(defaultTemplate); setItems([]);
      }
      setQuery(""); setResults([]); setSearchOpen(false);
    }
  }, [open, editMeal, defaultTemplate]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearchOpen(false); return; }
    setSearching(true);
    try {
      const data = await api.foods.list(q);
      setResults(data);
      setSearchOpen(true);
    } finally { setSearching(false); }
  }, []);

  async function addItem(food: Food) {
    let f = food;
    if (food.id === -1) f = await api.foods.importOff(food);
    setItems(prev => {
      if (prev.find(i => i.food.id === f.id)) return prev;
      return [...prev, { food: f, quantity: f.servingSize ?? 100, unit: f.defaultUnit }];
    });
    setQuery(""); setResults([]); setSearchOpen(false);
  }

  function removeItem(id: number) { setItems(p => p.filter(i => i.food.id !== id)); }

  function updateItem(id: number, field: "quantity" | "unit", value: string | number) {
    setItems(p => p.map(i => i.food.id === id ? { ...i, [field]: value } : i));
  }

  const totalKcal = items.reduce((s, i) => s + itemMacros(i).kcal, 0);
  const totalProt = items.reduce((s, i) => s + itemMacros(i).prot, 0);

  async function handleSave() {
    if (!name.trim() || items.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        name, isTemplate,
        loggedAt: isTemplate ? undefined : new Date().toISOString(),
        items: items.map(i => ({ foodId: i.food.id, quantity: i.quantity, unit: i.unit })),
      };
      if (isEdit && editMeal) await api.meals.update(editMeal.id, payload);
      else await api.meals.create(payload);
      onSaved(); onClose();
    } finally { setSaving(false); }
  }

  if (!open) return null;

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "oklch(0 0 0 / 0.55)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        display: "grid", placeItems: "center",
        padding: 20, animation: "oh-fade-in 0.2s ease both",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="oh-scale-in"
        style={{
          width: "min(560px, 100%)", maxHeight: "calc(100vh - 40px)",
          display: "flex", flexDirection: "column",
          background: "var(--oh-bg-2)",
          backdropFilter: "blur(24px) saturate(140%)", WebkitBackdropFilter: "blur(24px) saturate(140%)",
          border: "1px solid var(--oh-border-strong)",
          borderRadius: 20, boxShadow: "var(--oh-shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--oh-border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: "var(--oh-bg-3)",
              border: "1px solid var(--oh-border)", display: "grid", placeItems: "center", color: "var(--oh-fg-2)",
            }}>
              <Search size={15} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--oh-fg)" }}>{isEdit ? "Editar refeição" : "Nova refeição"}</span>
              <span style={{ fontSize: 11.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
                {isEdit ? `ID · ${editMeal?.id}` : "Nova entrada"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mode toggle */}
            <div style={{
              display: "inline-flex", padding: 3, background: "var(--oh-bg-2)",
              border: "1px solid var(--oh-border)", borderRadius: 11, gap: 2, position: "relative",
            }}>
              {(["log", "template"] as const).map(t => {
                const active = t === "template" ? isTemplate : !isTemplate;
                return (
                  <button key={t} onClick={() => setIsTemplate(t === "template")} style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 500, borderRadius: 9,
                    border: "none", cursor: "pointer", transition: "all 0.2s",
                    background: active ? "var(--oh-bg-3)" : "transparent",
                    color: active ? "var(--oh-fg)" : "var(--oh-fg-3)",
                    boxShadow: active ? "inset 0 1px 0 oklch(1 0 0 / 0.04), 0 1px 2px oklch(0 0 0 / 0.2)" : "none",
                    fontFamily: "var(--font-geist-sans)",
                  }}>
                    {t === "log" ? "Hoje" : "Salvar"}
                  </button>
                );
              })}
            </div>
            <button onClick={onClose} style={{
              width: 28, height: 28, display: "grid", placeItems: "center",
              border: "1px solid var(--oh-border)", borderRadius: 9,
              background: "transparent", color: "var(--oh-fg-2)", cursor: "pointer",
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 22, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Name */}
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--oh-fg-2)" }}>Nome da refeição</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Café da manhã, Almoço fit…"
              autoFocus
              style={inputSty}
              onFocus={e => (e.target.style.borderColor = "var(--oh-border-strong)")}
              onBlur={e => (e.target.style.borderColor = "var(--oh-border)")}
            />
          </label>

          {/* Food search */}
          <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--oh-fg-2)" }}>Adicionar alimento</span>
            <div ref={searchRef} style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--oh-fg-4)" }} />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); search(e.target.value); }}
                  onFocus={() => query && setSearchOpen(true)}
                  placeholder="Buscar por nome…"
                  style={{ ...inputSty, paddingLeft: 36 }}
                  onBlur={e => (e.target.style.borderColor = "var(--oh-border)")}
                />
                {searching && (
                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--oh-border-strong)", borderTopColor: "var(--oh-fg)", animation: "spin 0.6s linear infinite" }} />
                )}
              </div>
              {searchOpen && results.length > 0 && (
                <div className="oh-slide-down" style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "var(--oh-bg-2)", border: "1px solid var(--oh-border-strong)",
                  borderRadius: 12, boxShadow: "var(--oh-shadow-lg)", overflow: "hidden", zIndex: 10,
                }}>
                  {results.map((food, i) => (
                    <button key={food.id === -1 ? `off-${i}` : food.id} onClick={() => addItem(food)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: "transparent", border: "none",
                      color: "var(--oh-fg)", textAlign: "left", cursor: "pointer", transition: "background 0.12s",
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--oh-bg-3)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{food.name}</div>
                        <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
                          {food.source === "taco" ? "TACO" : food.id === -1 ? "Open Food Facts" : "Manual"}
                          {food.caloriesPer100g != null && ` · ${food.caloriesPer100g} kcal/100g`}
                          {food.proteinPer100g != null && ` · ${food.proteinPer100g}g prot`}
                        </div>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--oh-fg-4)", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>

          {/* Items */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Itens · {items.length}
              </span>
              {items.length > 0 && (
                <span style={{ fontSize: 12, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "var(--oh-fg)" }}>{Math.round(totalKcal)}</span> kcal ·{" "}
                  <span style={{ color: "var(--oh-fg)" }}>{totalProt.toFixed(1)}g</span> prot
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.length === 0 && (
                <div style={{
                  padding: 24, borderRadius: 12, border: "1px dashed var(--oh-border-strong)",
                  display: "grid", placeItems: "center", color: "var(--oh-fg-4)",
                  fontSize: 12.5, fontFamily: "var(--font-geist-mono)",
                }}>Nenhum item adicionado ainda</div>
              )}
              {items.map(item => {
                const { kcal, prot } = itemMacros(item);
                return (
                  <div key={item.food.id} className="oh-fade-in" style={{
                    padding: 14, borderRadius: 12, background: "var(--oh-bg-3)",
                    border: "1px solid var(--oh-border)", display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--oh-fg)" }}>{item.food.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                          {Math.round(kcal)} kcal · {prot.toFixed(1)}g prot
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.food.id)} style={{
                        width: 28, height: 28, display: "grid", placeItems: "center",
                        border: "1px solid var(--oh-border)", borderRadius: 9,
                        background: "transparent", color: "var(--oh-fg-3)", cursor: "pointer", flexShrink: 0,
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="number" value={item.quantity}
                        onChange={e => updateItem(item.food.id, "quantity", Number(e.target.value) || 0)}
                        style={{ ...inputSty, width: 88, textAlign: "center" }}
                        min={0}
                      />
                      <select
                        value={item.unit}
                        onChange={e => updateItem(item.food.id, "unit", e.target.value)}
                        style={{ ...inputSty, flex: 1, cursor: "pointer" }}
                      >
                        {UNIT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px", borderTop: "1px solid var(--oh-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          background: "var(--oh-bg)", flexShrink: 0,
        }}>
          <div style={{ fontSize: 11.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            {isTemplate ? "Será salva como refeição reutilizável" : "Adicionada ao diário de hoje"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              padding: "8px 14px", fontSize: 13, fontWeight: 500, borderRadius: 10,
              border: "1px solid transparent", background: "transparent", color: "var(--oh-fg-2)",
              cursor: "pointer", fontFamily: "var(--font-geist-sans)", transition: "all 0.15s",
            }}>Cancelar</button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || items.length === 0 || saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 14px", fontSize: 13, fontWeight: 500, borderRadius: 10,
                border: "1px solid var(--oh-accent)",
                background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
                cursor: name.trim() && items.length > 0 && !saving ? "pointer" : "not-allowed",
                opacity: name.trim() && items.length > 0 && !saving ? 1 : 0.5,
                boxShadow: "0 1px 0 oklch(1 0 0 / 0.15) inset, 0 2px 8px oklch(0 0 0 / 0.2)",
                transition: "all 0.15s", fontFamily: "var(--font-geist-sans)",
              }}
            >
              <Check size={15} />
              {isEdit ? "Salvar alterações" : isTemplate ? "Salvar refeição" : "Registrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
