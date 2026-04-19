"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { api, type Exercise } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseFormDialog } from "./exercise-form-dialog";

const MUSCLE_GROUPS = [
  { value: "", label: "Todos" },
  { value: "peito", label: "Peito" },
  { value: "costas", label: "Costas" },
  { value: "ombros", label: "Ombros" },
  { value: "braços", label: "Braços" },
  { value: "pernas", label: "Pernas" },
  { value: "core", label: "Core" },
  { value: "glúteos", label: "Glúteos" },
  { value: "cardio", label: "Cardio" },
  { value: "outro", label: "Outro" },
];

function ExerciseThumbnail({ gifUrl, name }: { gifUrl: string; name: string }) {
  const [frame, setFrame] = useState(0);
  const [ready, setReady] = useState(false);
  const loadCount = useState(0);

  const onLoad = () => {
    loadCount[1](n => {
      const next = n + 1;
      if (next >= 2) setReady(true);
      return next;
    });
  };

  useEffect(() => {
    if (!ready) return;
    const t = setInterval(() => setFrame(f => (f + 1) % 2), 700);
    return () => clearInterval(t);
  }, [ready]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img src={`${gifUrl}/0.jpg`} alt="" onLoad={onLoad} loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: frame === 0 && ready ? 1 : 0, transition: "opacity 0.1s" }} />
      <img src={`${gifUrl}/1.jpg`} alt="" onLoad={onLoad} loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: frame === 1 && ready ? 1 : 0, transition: "opacity 0.1s" }} />
    </div>
  );
}

function ExerciseAnimation({ gifUrl, name }: { gifUrl: string; name: string }) {
  const [frame, setFrame] = useState(0);
  const [loaded0, setLoaded0] = useState(false);
  const [loaded1, setLoaded1] = useState(false);
  const bothLoaded = loaded0 && loaded1;

  useEffect(() => {
    if (!bothLoaded) return;
    const t = setInterval(() => setFrame(f => (f + 1) % 2), 700);
    return () => clearInterval(t);
  }, [bothLoaded]);

  const img0 = `${gifUrl}/0.jpg`;
  const img1 = `${gifUrl}/1.jpg`;

  return (
    <div style={{ position: "relative", width: "100%", background: "var(--oh-bg-3)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--oh-border)", aspectRatio: "4/3" }}>
      {!bothLoaded && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--oh-fg-4)", fontSize: 12, fontFamily: "var(--font-geist-mono)" }}>
          Carregando...
        </div>
      )}
      <img
        src={img0}
        alt={`${name} — posição inicial`}
        onLoad={() => setLoaded0(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: frame === 0 && bothLoaded ? 1 : 0, transition: "opacity 0.15s" }}
      />
      <img
        src={img1}
        alt={`${name} — posição final`}
        onLoad={() => setLoaded1(true)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: frame === 1 && bothLoaded ? 1 : 0, transition: "opacity 0.15s" }}
      />
    </div>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [expanded, setExpanded] = useState(false);
  const hasLocalImages = exercise.gifUrl?.startsWith("/api/exercise-images/");

  return (
    <div className="oh-glass" style={{ borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 9, flexShrink: 0,
          background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)",
          overflow: "hidden",
          display: "grid", placeItems: "center",
          fontSize: 18,
        }}>
          {hasLocalImages && exercise.gifUrl ? (
            <ExerciseThumbnail gifUrl={exercise.gifUrl} name={exercise.name} />
          ) : (
            getMuscleEmoji(exercise.muscleGroup)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--oh-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {exercise.namePt || exercise.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 2 }}>
            {exercise.namePt ? exercise.name + " · " : ""}{exercise.muscleGroup}{exercise.equipment ? ` · ${exercise.equipment}` : ""}
          </div>
        </div>
        <div style={{ color: "var(--oh-fg-4)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--oh-border)" }}>
          {hasLocalImages && exercise.gifUrl && (
            <div style={{ marginTop: 12 }}>
              <ExerciseAnimation gifUrl={exercise.gifUrl} name={exercise.name} />
            </div>
          )}
          {exercise.description && (
            <p style={{ fontSize: 12.5, color: "var(--oh-fg-3)", lineHeight: 1.5, margin: "12px 0 0" }}>
              {exercise.description}
            </p>
          )}
          {!hasLocalImages && exercise.wgerId && exercise.gifUrl && (
            <div style={{ marginTop: 12, borderRadius: 8, overflow: "hidden", border: "1px solid var(--oh-border)" }}>
              <a
                href={exercise.gifUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", padding: "6px 10px", fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textDecoration: "none" }}
              >
                Ver detalhes no wger →
              </a>
            </div>
          )}
          {!exercise.description && !exercise.wgerId && (
            <p style={{ fontSize: 12.5, color: "var(--oh-fg-4)", margin: "12px 0 0", fontStyle: "italic" }}>
              Exercício manual — sem descrição.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function getMuscleEmoji(group: string): string {
  const map: Record<string, string> = {
    peito: "💪", costas: "🔙", ombros: "🫸", braços: "💪",
    pernas: "🦵", core: "🎯", glúteos: "🍑", cardio: "🏃", outro: "🏋️",
  };
  return map[group] ?? "🏋️";
}

interface Props {
  onSelectForWorkout?: (exercise: Exercise) => void;
  showSelectButton?: boolean;
}

export function ExerciseLibrary({ onSelectForWorkout, showSelectButton }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [version, setVersion] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await api.exercises.list({ q: query || undefined, group: group || undefined });
      setExercises(results);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [query, group]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load, version]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--oh-fg-4)", pointerEvents: "none" }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar exercício..."
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              borderRadius: 9, border: "1px solid var(--oh-border)",
              background: "var(--oh-bg-3)", color: "var(--oh-fg)", fontSize: 13.5,
              fontFamily: "var(--font-geist-sans)", outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 14px", borderRadius: 9,
            background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <Plus size={13} /> Criar
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {MUSCLE_GROUPS.map(mg => (
          <button
            key={mg.value}
            onClick={() => setGroup(mg.value)}
            style={{
              padding: "5px 12px", borderRadius: 20,
              border: "1px solid",
              borderColor: group === mg.value ? "var(--oh-accent)" : "var(--oh-border)",
              background: group === mg.value ? "var(--oh-accent-soft)" : "transparent",
              color: group === mg.value ? "var(--oh-fg)" : "var(--oh-fg-3)",
              fontSize: 12, fontWeight: group === mg.value ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {mg.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-xl" style={{ background: "var(--oh-bg-3)" }} />)}
        </div>
      ) : exercises.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--oh-fg-4)", fontSize: 13.5 }}>
          {query ? `Nenhum exercício encontrado para "${query}"` : "Nenhum exercício no catálogo ainda."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {exercises.map((ex, i) => (
            <div key={ex.id ?? i} style={{ position: "relative" }}>
              {showSelectButton && onSelectForWorkout && (
                <button
                  onClick={() => onSelectForWorkout(ex)}
                  style={{
                    position: "absolute", top: 10, right: 10, zIndex: 2,
                    padding: "4px 10px", borderRadius: 7,
                    background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
                    border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600,
                  }}
                >
                  + Adicionar
                </button>
              )}
              <ExerciseCard exercise={ex} />
            </div>
          ))}
        </div>
      )}

      <ExerciseFormDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSaved={() => { setVersion(v => v + 1); setShowCreateDialog(false); }}
      />
    </div>
  );
}
