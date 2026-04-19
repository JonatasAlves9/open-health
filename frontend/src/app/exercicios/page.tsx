"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { SubSidebar, type SectionId } from "@/components/exercicios/sub-sidebar";
import { WorkoutLog } from "@/components/exercicios/workout-log";
import { WorkoutTemplates } from "@/components/exercicios/workout-templates";
import { ExerciseLibrary } from "@/components/exercicios/exercise-library";
import { WorkoutOverview } from "@/components/exercicios/overview";
import { SettingsSection, DEFAULT_WORKOUT_SETTINGS, type WorkoutSettings } from "@/components/exercicios/settings-section";
import { NewWorkoutDialog } from "@/components/exercicios/new-workout-dialog";
import { api } from "@/lib/api";

const SETTINGS_KEY = "workout_settings";

const SECTION_HEADERS: Record<SectionId, { title: string; subtitle: string; showAdd?: boolean }> = {
  overview:   { title: "Visão geral",    subtitle: "Panorama de treinos — consistência e progressão." },
  today:      { title: "Hoje",           subtitle: "Sessões registradas hoje.", showAdd: true },
  templates:  { title: "Treinos salvos", subtitle: "Templates reutilizáveis para registrar treinos rapidamente.", showAdd: true },
  exercises:  { title: "Exercícios",     subtitle: "Catálogo de exercícios com busca e GIFs." },
  settings:   { title: "Configurações",  subtitle: "Peso corporal e metas de frequência." },
};

export default function ExerciciosPage() {
  const [section, setSection] = useState<SectionId>("overview");
  const [showDialog, setShowDialog] = useState(false);
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_WORKOUT_SETTINGS);
  const [workoutVersion, setWorkoutVersion] = useState(0);

  useEffect(() => {
    api.settings.get().then(s => {
      const saved = s[SETTINGS_KEY] as WorkoutSettings | undefined;
      if (saved && typeof saved.weeklyGoal === "number") setSettings(saved);
    }).catch(() => {});
  }, []);

  const handleSettingsChange = (s: WorkoutSettings) => {
    setSettings(s);
    api.settings.put(SETTINGS_KEY, s).catch(() => {});
  };

  const header = SECTION_HEADERS[section];

  return (
    <>
      <NewWorkoutDialog
        open={showDialog}
        defaultTemplate={section === "templates"}
        bodyWeightKg={settings.bodyWeightKg}
        onClose={() => setShowDialog(false)}
        onSaved={() => { setWorkoutVersion(v => v + 1); setShowDialog(false); }}
      />

      <div style={{ display: "flex", height: "calc(100vh - var(--mobile-header-h, 0px))", overflow: "hidden" }}>
        <SubSidebar current={section} onChange={setSection} />

        <div style={{
          flex: 1, minWidth: 0, overflowY: "auto",
          padding: "clamp(16px, 4vw, 36px) clamp(14px, 4vw, 44px) max(80px, env(safe-area-inset-bottom, 0px) + 80px)",
        }}>
          <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)",
                letterSpacing: "0.08em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>Treinos</span>
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
                <Plus size={15} /> {section === "templates" ? "Novo template" : "Novo treino"}
              </button>
            )}
          </div>

          {section === "overview" && (
            <WorkoutOverview key={workoutVersion} settings={settings} onGoToToday={() => setSection("today")} />
          )}
          {section === "today" && (
            <WorkoutLog
              bodyWeightKg={settings.bodyWeightKg}
              onNewWorkout={() => setShowDialog(true)}
              version={workoutVersion}
            />
          )}
          {section === "templates" && (
            <WorkoutTemplates
              bodyWeightKg={settings.bodyWeightKg}
              onLoggedFromTemplate={() => { setWorkoutVersion(v => v + 1); setSection("today"); }}
            />
          )}
          {section === "exercises" && <ExerciseLibrary />}
          {section === "settings" && (
            <SettingsSection
              settings={settings}
              onChange={handleSettingsChange}
              onReset={() => handleSettingsChange(DEFAULT_WORKOUT_SETTINGS)}
            />
          )}
        </div>
      </div>
    </>
  );
}
