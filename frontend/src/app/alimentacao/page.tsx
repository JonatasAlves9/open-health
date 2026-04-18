"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { SubSidebar, type SectionId } from "@/components/alimentacao/sub-sidebar";
import { MealLog } from "@/components/alimentacao/meal-log";
import { MealTemplates } from "@/components/alimentacao/meal-templates";
import { FoodSearch } from "@/components/alimentacao/food-search";
import { OverviewSection } from "@/components/alimentacao/overview";
import { SettingsSection, DEFAULT_TARGETS, type DailyTargets } from "@/components/alimentacao/settings-section";
import { NewMealDialog } from "@/components/alimentacao/new-meal-dialog";

const STORAGE_KEY = "openhealth-targets";

function loadTargets(): DailyTargets {
  if (typeof window === "undefined") return DEFAULT_TARGETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TARGETS;
  } catch {
    return DEFAULT_TARGETS;
  }
}

const SECTION_HEADERS: Record<SectionId, { title: string; subtitle: string; showAdd?: boolean }> = {
  overview:  { title: "Visão geral",      subtitle: "Panorama nutricional — tendências e consistência." },
  today:     { title: "Hoje",             subtitle: "Refeições registradas no diário.", showAdd: true },
  saved:     { title: "Refeições salvas", subtitle: "Modelos reutilizáveis para registrar rápido.", showAdd: true },
  foods:     { title: "Alimentos",        subtitle: "Base TACO e alimentos cadastrados." },
  settings:  { title: "Configurações",    subtitle: "Metas diárias e preferências da seção." },
};

export default function AlimentacaoPage() {
  const [section, setSection] = useState<SectionId>("overview");
  const [showDialog, setShowDialog] = useState(false);
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);

  useEffect(() => { setTargets(loadTargets()); }, []);

  const handleTargetsChange = (t: DailyTargets) => {
    setTargets(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  };

  const header = SECTION_HEADERS[section];
  const density = 1;

  return (
    <>
      <NewMealDialog open={showDialog} onClose={() => setShowDialog(false)} onSaved={() => {}} defaultTemplate={section === "saved"} />

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <SubSidebar
          current={section}
          onChange={setSection}
          targetsUpdatedAt="Metas revisadas recentemente"
        />

        <div style={{
          flex: 1, minWidth: 0, overflow: "auto",
          padding: `${36 * density}px ${44 * density}px ${60 * density}px`,
        }}>
          {/* Page header */}
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.08em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>Nutrição</span>
                <span>/</span>
                <span>{header.title}</span>
              </div>
              <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--oh-fg)", margin: 0, lineHeight: 1.1 }}>
                {header.title}
              </h1>
              <p style={{ fontSize: 13, color: "var(--oh-fg-3)", margin: 0 }}>{header.subtitle}</p>
            </div>

            {header.showAdd && (
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

          {/* Section content */}
          {section === "overview" && (
            <OverviewSection targets={targets} onGoToToday={() => setSection("today")} />
          )}
          {section === "today" && (
            <MealLog onNewMeal={() => setShowDialog(true)} />
          )}
          {section === "saved" && (
            <MealTemplates />
          )}
          {section === "foods" && (
            <FoodSearch />
          )}
          {section === "settings" && (
            <SettingsSection
              targets={targets}
              onChange={handleTargetsChange}
              onReset={() => handleTargetsChange(DEFAULT_TARGETS)}
            />
          )}
        </div>
      </div>
    </>
  );
}
