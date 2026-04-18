"use client";

import {
  TrendingUp, Clock, Layers, UtensilsCrossed, Settings,
  Utensils, Sparkles,
} from "lucide-react";

export type SectionId = "overview" | "today" | "saved" | "foods" | "settings";

interface Section {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  badge?: number;
  group?: string;
}

const SECTIONS: Section[] = [
  { id: "overview",  label: "Visão geral",      icon: TrendingUp },
  { id: "today",     label: "Hoje",              icon: Clock },
  { id: "saved",     label: "Refeições salvas",  icon: Layers },
  { id: "foods",     label: "Alimentos",         icon: UtensilsCrossed },
  { id: "settings",  label: "Configurações",     icon: Settings, group: "Preferências" },
];

interface Props {
  current: SectionId;
  onChange: (s: SectionId) => void;
  badges?: Partial<Record<SectionId, number>>;
  targetsUpdatedAt?: string;
}

export function SubSidebar({ current, onChange, badges, targetsUpdatedAt }: Props) {
  const groups = SECTIONS.reduce<Record<string, Section[]>>((acc, s) => {
    const g = s.group ?? "__main";
    (acc[g] = acc[g] ?? []).push(s);
    return acc;
  }, {});
  const orderedGroups = ["__main", ...Object.keys(groups).filter(g => g !== "__main")];

  return (
    <aside style={{
      width: 220, minWidth: 220,
      padding: "22px 14px 18px",
      borderRight: "1px solid var(--oh-border)",
      background: "var(--oh-bg-2)",
      backdropFilter: "blur(18px) saturate(140%)",
      WebkitBackdropFilter: "blur(18px) saturate(140%)",
      display: "flex", flexDirection: "column", gap: 18,
      position: "sticky", top: 0, height: "100vh",
    }}>
      {/* Module header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 10px 14px",
        borderBottom: "1px solid var(--oh-border)",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: "var(--oh-accent-soft)",
          border: "1px solid var(--oh-border)",
          display: "grid", placeItems: "center",
          color: "var(--oh-fg)",
          flexShrink: 0,
        }}>
          <Utensils size={14} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
          <span style={{ fontSize: 10, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Módulo</span>
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--oh-fg)" }}>Alimentação</span>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, overflow: "auto" }}>
        {orderedGroups.map(g => (
          <div key={g} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {g !== "__main" && (
              <span style={{
                fontSize: 10, color: "var(--oh-fg-4)",
                fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.12em",
                padding: "2px 10px 4px",
              }}>{g}</span>
            )}
            {groups[g].map(s => {
              const isActive = current === s.id;
              const badge = badges?.[s.id];
              const IconComp = s.icon;
              return (
                <button key={s.id}
                  onClick={() => onChange(s.id)}
                  style={{
                    position: "relative",
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px",
                    borderRadius: 9,
                    border: "1px solid transparent",
                    background: isActive ? "var(--oh-bg-3)" : "transparent",
                    color: isActive ? "var(--oh-fg)" : "var(--oh-fg-3)",
                    fontSize: 12.5, fontWeight: 500,
                    textAlign: "left",
                    transition: "all 0.15s",
                    cursor: "pointer",
                    width: "100%",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "var(--oh-surface)";
                      (e.currentTarget as HTMLElement).style.color = "var(--oh-fg)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--oh-fg-3)";
                    }
                  }}
                >
                  {isActive && (
                    <span style={{
                      position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)",
                      width: 2, height: 16, borderRadius: 1, background: "var(--oh-accent)",
                    }} />
                  )}
                  <IconComp size={14} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span>
                  {badge != null && (
                    <span style={{
                      fontSize: 10, fontFamily: "var(--font-geist-mono)",
                      padding: "1px 6px", borderRadius: 5,
                      background: isActive ? "var(--oh-accent-soft)" : "var(--oh-bg-3)",
                      border: "1px solid var(--oh-border)",
                      color: "var(--oh-fg-3)",
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: "10px 12px", borderRadius: 10,
        background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <Sparkles size={13} style={{ color: "var(--oh-fg-3)", flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, color: "var(--oh-fg-3)", lineHeight: 1.35 }}>
          {targetsUpdatedAt ?? "Metas configuradas"}
        </span>
      </div>
    </aside>
  );
}
