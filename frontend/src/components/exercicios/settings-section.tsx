"use client";

import { useState } from "react";

export type WorkoutSettings = {
  bodyWeightKg: number | null;
  weeklyGoal: number;
};

export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettings = {
  bodyWeightKg: null,
  weeklyGoal: 3,
};

interface Props {
  settings: WorkoutSettings;
  onChange: (s: WorkoutSettings) => void;
  onReset: () => void;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--oh-fg)" }}>{label}</label>
      {hint && <span style={{ fontSize: 11.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>{hint}</span>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 9,
  border: "1px solid var(--oh-border)",
  background: "var(--oh-bg-3)",
  color: "var(--oh-fg)",
  fontSize: 13.5,
  fontFamily: "var(--font-geist-sans)",
  width: "100%",
  outline: "none",
};

export function SettingsSection({ settings, onChange, onReset }: Props) {
  const [local, setLocal] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onChange(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 480, display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="oh-glass" style={{ padding: 20, borderRadius: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", borderBottom: "1px solid var(--oh-border)", paddingBottom: 12 }}>
          Corpo
        </div>

        <Field
          label="Peso corporal"
          hint="Usado para calcular calorias queimadas no cardio (fórmula MET). Deixe vazio para não calcular."
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              min={20}
              max={300}
              step={0.1}
              value={local.bodyWeightKg ?? ""}
              onChange={e => setLocal(s => ({ ...s, bodyWeightKg: e.target.value ? Number(e.target.value) : null }))}
              placeholder="ex: 75"
              style={{ ...inputStyle, maxWidth: 140 }}
            />
            <span style={{ fontSize: 13, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>kg</span>
          </div>
        </Field>
      </div>

      <div className="oh-glass" style={{ padding: 20, borderRadius: 16, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", borderBottom: "1px solid var(--oh-border)", paddingBottom: 12 }}>
          Metas
        </div>

        <Field
          label="Frequência semanal"
          hint="Quantos treinos por semana você pretende realizar. Usado para calcular aderência no panorama."
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setLocal(s => ({ ...s, weeklyGoal: n }))}
                style={{
                  padding: "7px 16px", borderRadius: 9,
                  border: "1px solid",
                  borderColor: local.weeklyGoal === n ? "var(--oh-accent)" : "var(--oh-border)",
                  background: local.weeklyGoal === n ? "var(--oh-accent-soft)" : "transparent",
                  color: local.weeklyGoal === n ? "var(--oh-fg)" : "var(--oh-fg-3)",
                  fontSize: 13, fontWeight: local.weeklyGoal === n ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {n}×/sem
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={handleSave}
          style={{
            padding: "10px 20px", borderRadius: 10,
            background: saved ? "var(--oh-success)" : "var(--oh-accent)",
            color: "var(--oh-accent-fg)",
            border: "none", cursor: "pointer",
            fontSize: 13.5, fontWeight: 600,
            transition: "background 0.2s",
          }}
        >
          {saved ? "Salvo!" : "Salvar"}
        </button>
        <button
          onClick={() => { setLocal(DEFAULT_WORKOUT_SETTINGS); onReset(); }}
          style={{
            padding: "10px 16px", borderRadius: 10,
            background: "transparent",
            color: "var(--oh-fg-3)",
            border: "1px solid var(--oh-border)", cursor: "pointer",
            fontSize: 13, fontWeight: 500,
          }}
        >
          Resetar padrões
        </button>
      </div>
    </div>
  );
}
