"use client";

import { useState, useEffect } from "react";
import { Plus, Flame } from "lucide-react";
import { api, type WorkoutSession } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutSessionCard } from "./workout-session-card";
import { NewWorkoutDialog } from "./new-workout-dialog";

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  bodyWeightKg: number | null;
  onNewWorkout: () => void;
  version: number;
}

export function WorkoutLog({ bodyWeightKg, onNewWorkout, version }: Props) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null);
  const [detailedSessions, setDetailedSessions] = useState<Record<number, WorkoutSession>>({});
  const today = isoDate(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.workouts.list({ date: today });
      setSessions(result);
      const detailed = await Promise.all(result.map(s => api.workouts.get(s.id)));
      const map: Record<number, WorkoutSession> = {};
      detailed.forEach(s => { map[s.id] = s; });
      setDetailedSessions(map);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [version]);

  const handleDelete = async (id: number) => {
    await api.workouts.delete(id);
    load();
  };

  const totalKcal = sessions.reduce((s, session) => s + (session.kcalBurned ?? 0), 0);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-[14px]" style={{ background: "var(--oh-bg-3)" }} />)}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sessions.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12.5, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            {sessions.length} sessão{sessions.length > 1 ? "ões" : ""} hoje
          </span>
          {totalKcal > 0 && (
            <span style={{ fontSize: 12.5, color: "var(--oh-warn)", fontFamily: "var(--font-geist-mono)", display: "flex", alignItems: "center", gap: 4 }}>
              <Flame size={12} /> {Math.round(totalKcal)} kcal gastas
            </span>
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <div style={{
          padding: 32, textAlign: "center",
          borderRadius: 14, border: "1px dashed var(--oh-border)",
          display: "flex", flexDirection: "column", gap: 12, alignItems: "center",
        }}>
          <span style={{ fontSize: 28 }}>🏋️</span>
          <div style={{ fontSize: 14, color: "var(--oh-fg-3)" }}>Nenhum treino registrado hoje.</div>
          <button
            onClick={onNewWorkout}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 10,
              background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
              border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}
          >
            <Plus size={13} /> Registrar treino
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map(s => (
            <WorkoutSessionCard
              key={s.id}
              session={detailedSessions[s.id] ?? s}
              onEdit={session => setEditSession(session)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editSession && (
        <NewWorkoutDialog
          open
          initialSession={editSession}
          bodyWeightKg={bodyWeightKg}
          onClose={() => setEditSession(null)}
          onSaved={() => { setEditSession(null); load(); }}
        />
      )}
    </div>
  );
}
