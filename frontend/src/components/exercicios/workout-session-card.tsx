"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Flame, Dumbbell, Wind } from "lucide-react";
import type { WorkoutSession } from "@/lib/api";

interface Props {
  session: WorkoutSession;
  onEdit: (s: WorkoutSession) => void;
  onDelete: (id: number) => void;
}

export function WorkoutSessionCard({ session, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasSets = (session.sets?.length ?? 0) > 0;
  const hasCardio = (session.cardio?.length ?? 0) > 0;
  const totalVolume = session.sets?.reduce((s, set) =>
    s + (set.weightKg ?? 0) * (set.reps ?? 0), 0) ?? 0;

  const exercisesByName = session.sets?.reduce<Record<string, typeof session.sets>>((acc, s) => {
    const name = s.exercise?.name ?? `Exercício ${s.exerciseId}`;
    (acc[name] = acc[name] ?? []).push(s);
    return acc;
  }, {}) ?? {};

  return (
    <div className="oh-glass" style={{ borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: hasSets ? "oklch(0.4 0.08 260 / 0.15)" : "oklch(0.4 0.08 155 / 0.15)",
          border: "1px solid var(--oh-border)",
          display: "grid", placeItems: "center",
          color: hasSets ? "var(--oh-fg-2)" : "var(--oh-success)",
        }}>
          {hasSets ? <Dumbbell size={16} /> : <Wind size={16} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.name}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            {hasSets && (
              <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
                {Object.keys(exercisesByName).length} exerc. · {Math.round(totalVolume).toLocaleString("pt-BR")} kg vol.
              </span>
            )}
            {hasCardio && session.cardio?.map((c, i) => (
              <span key={i} style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
                {c.modality} {c.durationMin}min{c.distanceKm ? ` · ${c.distanceKm}km` : ""}
              </span>
            ))}
            {session.kcalBurned != null && session.kcalBurned > 0 && (
              <span style={{ fontSize: 11, color: "var(--oh-warn)", fontFamily: "var(--font-geist-mono)", display: "flex", alignItems: "center", gap: 3 }}>
                <Flame size={10} /> {Math.round(session.kcalBurned)} kcal
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)", padding: 4 }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onEdit(session)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)", padding: 4 }}
          >
            <Pencil size={13} />
          </button>
          {confirmDelete ? (
            <span style={{ display: "flex", gap: 4 }}>
              <button
                onClick={() => onDelete(session.id)}
                style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--oh-danger)", color: "#fff", border: "none", cursor: "pointer" }}
              >Excluir</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--oh-bg-3)", color: "var(--oh-fg-3)", border: "1px solid var(--oh-border)", cursor: "pointer" }}
              >Cancelar</button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)", padding: 4 }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--oh-border)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(exercisesByName).map(([name, sets]) => (
            <div key={name}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--oh-fg-2)", marginBottom: 6 }}>{name}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {sets.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)" }}>
                    <span style={{ width: 20, color: "var(--oh-fg-4)" }}>#{s.setNumber}</span>
                    {s.reps != null && <span>{s.reps} reps</span>}
                    {s.weightKg != null && s.weightKg > 0 && <span>@ {s.weightKg}kg</span>}
                    {s.rpe != null && <span>RPE {s.rpe}</span>}
                    {s.notes && <span style={{ color: "var(--oh-fg-4)", fontStyle: "italic" }}>{s.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {session.cardio?.map((c, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)" }}>
              <span style={{ color: "var(--oh-fg-2)", fontWeight: 600 }}>{c.modality}</span>
              {" · "}{c.durationMin}min · {c.intensity}
              {c.distanceKm && ` · ${c.distanceKm}km`}
              {c.kcalBurned && ` · ~${Math.round(c.kcalBurned)}kcal`}
            </div>
          ))}

          {session.notes && (
            <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontStyle: "italic", paddingTop: 4, borderTop: "1px solid var(--oh-border)" }}>
              {session.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
