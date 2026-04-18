"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp, Clock, Layers, UtensilsCrossed, Settings,
  Utensils,
} from "lucide-react";

export type SectionId = "overview" | "today" | "saved" | "foods" | "settings";

interface Section {
  id: SectionId;
  label: string;
  labelShort: string;
  icon: React.ElementType;
  group?: string;
}

const SECTIONS: Section[] = [
  { id: "overview",  label: "Visão geral",      labelShort: "Visão",     icon: TrendingUp },
  { id: "today",     label: "Hoje",              labelShort: "Hoje",      icon: Clock },
  { id: "saved",     label: "Refeições salvas",  labelShort: "Salvas",    icon: Layers },
  { id: "foods",     label: "Alimentos",         labelShort: "Alimentos", icon: UtensilsCrossed },
  { id: "settings",  label: "Configurações",     labelShort: "Config",    icon: Settings, group: "Preferências" },
];

interface Props {
  current: SectionId;
  onChange: (s: SectionId) => void;
  badges?: Partial<Record<SectionId, number>>;
  targetsUpdatedAt?: string;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export function SubSidebar({ current, onChange, badges }: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "stretch",
        background: "var(--oh-bg-2)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderTop: "1px solid var(--oh-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {SECTIONS.map(s => {
          const isActive = current === s.id;
          const IconComp = s.icon;
          const badge = badges?.[s.id];
          return (
            <button key={s.id} onClick={() => onChange(s.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "10px 4px 8px",
              background: "transparent", border: "none", cursor: "pointer",
              color: isActive ? "var(--oh-accent)" : "var(--oh-fg-3)",
              transition: "color 0.15s", position: "relative",
            }}>
              {isActive && (
                <span style={{
                  position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                  width: 28, height: 2, borderRadius: 2, background: "var(--oh-accent)",
                }} />
              )}
              <div style={{ position: "relative" }}>
                <IconComp size={20} />
                {badge != null && (
                  <span style={{
                    position: "absolute", top: -5, right: -7,
                    fontSize: 9, fontFamily: "var(--font-geist-mono)",
                    padding: "1px 4px", borderRadius: 5,
                    background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
                    lineHeight: 1.4,
                  }}>{badge}</span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: "-0.01em" }}>
                {s.labelShort}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

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
      height: "100%", overflowY: "auto",
    }}>
      {/* Module header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 10px 14px",
        borderBottom: "1px solid var(--oh-border)",
        flexShrink: 0,
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
      <nav style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
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
    </aside>
  );
}
