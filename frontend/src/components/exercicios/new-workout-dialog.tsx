"use client";

import { useState, useMemo } from "react";
import { X, Plus, Trash2, Search } from "lucide-react";
import { api, type Exercise, type WorkoutSession } from "@/lib/api";

type Tab = "forca" | "cardio";

type SetEntry = {
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  reps: number | "";
  weightKg: number | "";
  rpe: number | "";
};

type CardioEntry = {
  modality: "corrida" | "caminhada" | "bike" | "natacao" | "outro";
  durationMin: number | "";
  distanceKm: number | "";
  intensity: "leve" | "moderada" | "intensa";
};

const CARDIO_MET: Record<string, Record<string, number>> = {
  corrida:   { leve: 6.0, moderada: 9.8, intensa: 14.5 },
  caminhada: { leve: 2.8, moderada: 3.8, intensa: 5.0 },
  bike:      { leve: 4.0, moderada: 7.5, intensa: 12.0 },
  natacao:   { leve: 5.0, moderada: 7.0, intensa: 10.0 },
  outro:     { leve: 3.5, moderada: 5.0, intensa: 8.0 },
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultTemplate?: boolean;
  initialSession?: WorkoutSession;
  bodyWeightKg?: number | null;
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px", borderRadius: 8,
  border: "1px solid var(--oh-border)",
  background: "var(--oh-bg-3)", color: "var(--oh-fg)", fontSize: 13,
  fontFamily: "var(--font-geist-sans)", width: "100%", outline: "none",
};

function ExerciseSearch({ onSelect }: { onSelect: (ex: Exercise) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (term: string) => {
    setQ(term);
    if (!term.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await api.exercises.list({ q: term });
      setResults(res.slice(0, 8));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--oh-fg-4)", pointerEvents: "none" }} />
        <input
          value={q}
          onChange={e => search(e.target.value)}
          placeholder="Buscar exercício..."
          style={{ ...inputStyle, paddingLeft: 28 }}
        />
      </div>
      {results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
          background: "var(--oh-bg-2)", border: "1px solid var(--oh-border-strong)",
          borderRadius: 10, marginTop: 4, overflow: "hidden",
          boxShadow: "var(--oh-shadow-sm)",
        }}>
          {results.map((ex, i) => (
            <button
              key={ex.id ?? i}
              onClick={() => { onSelect(ex); setQ(""); setResults([]); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", background: "transparent", border: "none",
                cursor: "pointer", textAlign: "left",
                borderBottom: i < results.length - 1 ? "1px solid var(--oh-border)" : "none",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--oh-surface)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--oh-fg)" }}>{ex.namePt || ex.name}</div>
                {ex.namePt && <div style={{ fontSize: 10.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>{ex.name}</div>}
              </div>
              <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>{ex.muscleGroup}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewWorkoutDialog({ open, onClose, onSaved, defaultTemplate, initialSession, bodyWeightKg }: Props) {
  const [tab, setTab] = useState<Tab>("forca");
  const [name, setName] = useState(initialSession?.name ?? "");
  const [isTemplate, setIsTemplate] = useState(initialSession?.isTemplate ?? defaultTemplate ?? false);
  const [notes, setNotes] = useState(initialSession?.notes ?? "");
  const [sets, setSets] = useState<SetEntry[]>(
    initialSession?.sets?.map(s => ({
      exerciseId: s.exerciseId,
      exerciseName: s.exercise?.namePt ?? s.exercise?.name ?? "",
      setNumber: s.setNumber,
      reps: s.reps ?? "",
      weightKg: s.weightKg ?? "",
      rpe: s.rpe ?? "",
    })) ?? []
  );
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>(
    initialSession?.cardio?.map(c => ({
      modality: c.modality,
      durationMin: c.durationMin,
      distanceKm: c.distanceKm ?? "",
      intensity: c.intensity,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExercise = (ex: Exercise) => {
    const nextSet = sets.length + 1;
    setSets(s => [...s, {
      exerciseId: ex.id,
      exerciseName: ex.namePt || ex.name,
      setNumber: nextSet,
      reps: "",
      weightKg: "",
      rpe: "",
    }]);
  };

  const addSetToExercise = (exerciseId: number, exerciseName: string) => {
    const setsForExercise = sets.filter(s => s.exerciseId === exerciseId);
    setSets(s => [...s, {
      exerciseId,
      exerciseName,
      setNumber: setsForExercise.length + 1,
      reps: "",
      weightKg: "",
      rpe: "",
    }]);
  };

  const removeSet = (idx: number) => {
    setSets(s => s.filter((_, i) => i !== idx));
  };

  const updateSet = (idx: number, field: keyof SetEntry, value: string | number) => {
    setSets(s => s.map((set, i) => i === idx ? { ...set, [field]: value } : set));
  };

  const groupedSets = useMemo(() => {
    const groups: Record<number, { name: string; sets: Array<SetEntry & { idx: number }> }> = {};
    sets.forEach((s, idx) => {
      if (!groups[s.exerciseId]) groups[s.exerciseId] = { name: s.exerciseName, sets: [] };
      groups[s.exerciseId].sets.push({ ...s, idx });
    });
    return Object.entries(groups).map(([id, g]) => ({ exerciseId: Number(id), ...g }));
  }, [sets]);

  const estimatedKcal = useMemo(() => {
    // MET 5.0 para treino de força, ~3 min por set (trabalho + descanso)
    const bw = bodyWeightKg ?? 75;
    const strengthKcal = sets.length > 0 ? 5.0 * bw * (sets.length * 3 / 60) : 0;
    const cardioKcal = cardioEntries.reduce((sum, c) => {
      if (!bodyWeightKg || !c.durationMin) return sum;
      const met = (CARDIO_MET[c.modality] ?? CARDIO_MET["outro"])[c.intensity] ?? 5;
      return sum + met * bodyWeightKg * (Number(c.durationMin) / 60);
    }, 0);
    return Math.round(strengthKcal + cardioKcal);
  }, [sets, cardioEntries, bodyWeightKg]);

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Parameters<typeof api.workouts.create>[0] = {
        name: name.trim(),
        isTemplate,
        loggedAt: isTemplate ? undefined : new Date().toISOString(),
        notes: notes || undefined,
        bodyWeightKg: bodyWeightKg ?? undefined,
        sets: sets.map(s => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          reps: Number(s.reps) || undefined,
          weightKg: Number(s.weightKg) || undefined,
          rpe: Number(s.rpe) || undefined,
        })),
        cardio: cardioEntries.map(c => ({
          modality: c.modality,
          durationMin: Number(c.durationMin),
          distanceKm: Number(c.distanceKm) || undefined,
          intensity: c.intensity,
        })),
      };
      if (initialSession) {
        await api.workouts.update(initialSession.id, payload);
      } else {
        await api.workouts.create(payload);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "oklch(0 0 0 / 0.5)",
      backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div
        style={{
          width: "100%", maxWidth: 560,
          background: "var(--oh-bg-2)",
          border: "1px solid var(--oh-border-strong)",
          borderRadius: "18px 18px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          maxHeight: "90vh", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--oh-fg)" }}>
            {initialSession ? "Editar treino" : isTemplate ? "Novo template" : "Registrar treino"}
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-3)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do treino (ex: Treino A — Peito)"
          style={{ ...inputStyle, fontSize: 14 }}
        />

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--oh-fg-3)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={e => setIsTemplate(e.target.checked)}
              style={{ width: 14, height: 14 }}
            />
            Salvar como template
          </label>
        </div>

        <div style={{ display: "flex", padding: 3, background: "var(--oh-bg-3)", borderRadius: 10, gap: 2 }}>
          {(["forca", "cardio"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "7px", borderRadius: 8, border: "none",
              background: tab === t ? "var(--oh-bg-2)" : "transparent",
              color: tab === t ? "var(--oh-fg)" : "var(--oh-fg-3)",
              fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer",
              outline: tab === t ? "1px solid var(--oh-border)" : "none",
            }}>
              {t === "forca" ? "💪 Força" : "🏃 Cardio"}
            </button>
          ))}
        </div>

        {tab === "forca" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ExerciseSearch onSelect={addExercise} />

            {groupedSets.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: "var(--oh-fg-4)", fontSize: 13, borderRadius: 10, border: "1px dashed var(--oh-border)" }}>
                Busque e adicione exercícios acima
              </div>
            )}

            {groupedSets.map(group => (
              <div key={group.exerciseId} className="oh-glass" style={{ padding: 12, borderRadius: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--oh-fg)", marginBottom: 8 }}>{group.name}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr 28px", gap: 6, fontSize: 10.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    <span>#</span><span>Reps</span><span>Peso kg</span><span>RPE</span><span />
                  </div>
                  {group.sets.map(s => (
                    <div key={s.idx} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 1fr 28px", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textAlign: "center" }}>{s.setNumber}</span>
                      <input
                        type="number" min={1} value={s.reps}
                        onChange={e => updateSet(s.idx, "reps", e.target.value ? Number(e.target.value) : "")}
                        placeholder="—" style={inputStyle}
                      />
                      <input
                        type="number" min={0} step={0.5} value={s.weightKg}
                        onChange={e => updateSet(s.idx, "weightKg", e.target.value ? Number(e.target.value) : "")}
                        placeholder="—" style={inputStyle}
                      />
                      <input
                        type="number" min={1} max={10} step={0.5} value={s.rpe}
                        onChange={e => updateSet(s.idx, "rpe", e.target.value ? Number(e.target.value) : "")}
                        placeholder="—" style={inputStyle}
                      />
                      <button onClick={() => removeSet(s.idx)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addSetToExercise(group.exerciseId, group.name)}
                  style={{ marginTop: 8, fontSize: 12, color: "var(--oh-accent)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Plus size={12} /> Série
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "cardio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cardioEntries.map((c, i) => (
              <div key={i} className="oh-glass" style={{ padding: 12, borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--oh-fg)" }}>Cardio {i + 1}</span>
                  <button onClick={() => setCardioEntries(e => e.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Modalidade</label>
                    <select
                      value={c.modality}
                      onChange={e => setCardioEntries(entries => entries.map((ce, j) => j === i ? { ...ce, modality: e.target.value as CardioEntry["modality"] } : ce))}
                      style={inputStyle}
                    >
                      {["corrida", "caminhada", "bike", "natacao", "outro"].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Duração (min)</label>
                    <input
                      type="number" min={1} value={c.durationMin}
                      onChange={e => setCardioEntries(entries => entries.map((ce, j) => j === i ? { ...ce, durationMin: e.target.value ? Number(e.target.value) : "" } : ce))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Intensidade</label>
                    <select
                      value={c.intensity}
                      onChange={e => setCardioEntries(entries => entries.map((ce, j) => j === i ? { ...ce, intensity: e.target.value as CardioEntry["intensity"] } : ce))}
                      style={inputStyle}
                    >
                      {["leve", "moderada", "intensa"].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>Distância (km)</label>
                    <input
                      type="number" min={0} step={0.1} value={c.distanceKm}
                      onChange={e => setCardioEntries(entries => entries.map((ce, j) => j === i ? { ...ce, distanceKm: e.target.value ? Number(e.target.value) : "" } : ce))}
                      placeholder="opcional"
                      style={inputStyle}
                    />
                  </div>
                </div>
                {bodyWeightKg && c.durationMin ? (
                  <div style={{ fontSize: 11, color: "var(--oh-warn)", fontFamily: "var(--font-geist-mono)" }}>
                    ~{Math.round((CARDIO_MET[c.modality] ?? CARDIO_MET["outro"])[c.intensity] * bodyWeightKg * (Number(c.durationMin) / 60))} kcal estimadas
                  </div>
                ) : !bodyWeightKg && c.durationMin ? (
                  <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
                    Configure seu peso nas configurações para calcular calorias
                  </div>
                ) : null}
              </div>
            ))}
            <button
              onClick={() => setCardioEntries(e => [...e, { modality: "corrida", durationMin: "", distanceKm: "", intensity: "moderada" }])}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px", borderRadius: 10,
                border: "1px dashed var(--oh-border)",
                background: "transparent", color: "var(--oh-fg-3)",
                cursor: "pointer", fontSize: 13,
              }}
            >
              <Plus size={13} /> Adicionar cardio
            </button>
          </div>
        )}

        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          rows={2}
          style={{ ...inputStyle, resize: "vertical", fontSize: 13 }}
        />

        {estimatedKcal > 0 && (
          <div style={{ padding: "8px 12px", borderRadius: 9, background: "oklch(0.4 0.08 75 / 0.1)", border: "1px solid oklch(0.6 0.1 75 / 0.2)", fontSize: 12.5, color: "var(--oh-warn)", fontFamily: "var(--font-geist-mono)" }}>
            ~{estimatedKcal} kcal estimadas nessa sessão
          </div>
        )}

        {error && <div style={{ fontSize: 12.5, color: "var(--oh-danger)", fontFamily: "var(--font-geist-mono)" }}>{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px", borderRadius: 10,
            background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
            border: "none", cursor: saving ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : initialSession ? "Salvar alterações" : isTemplate ? "Criar template" : "Registrar treino"}
        </button>
      </div>
    </div>
  );
}
