"use client";

import { useState, useEffect } from "react";
import { Plus, Play, Pencil, Trash2 } from "lucide-react";
import { api, type WorkoutSession } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { NewWorkoutDialog } from "./new-workout-dialog";

interface Props {
  bodyWeightKg: number | null;
  onLoggedFromTemplate: () => void;
}

function fmtDate(iso: string | null) {
  if (!iso) return "Nunca usado";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function WorkoutTemplates({ bodyWeightKg, onLoggedFromTemplate }: Props) {
  const [templates, setTemplates] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState<WorkoutSession | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [loggingId, setLoggingId] = useState<number | null>(null);
  const [version, setVersion] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const result = await api.workouts.list({ templates: true });
      setTemplates(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [version]);

  const handleLog = async (id: number) => {
    setLoggingId(id);
    try {
      await api.workouts.logFromTemplate(id);
      onLoggedFromTemplate();
    } finally {
      setLoggingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    await api.workouts.delete(id);
    setConfirmDelete(null);
    setVersion(v => v + 1);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-[14px]" style={{ background: "var(--oh-bg-3)" }} />)}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 16px", borderRadius: 10,
            background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          <Plus size={13} /> Novo template
        </button>
      </div>

      {templates.length === 0 ? (
        <div style={{
          padding: 32, textAlign: "center",
          borderRadius: 14, border: "1px dashed var(--oh-border)",
          display: "flex", flexDirection: "column", gap: 10, alignItems: "center",
        }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <div style={{ fontSize: 14, color: "var(--oh-fg-3)" }}>Nenhum template salvo ainda.</div>
          <div style={{ fontSize: 12.5, color: "var(--oh-fg-4)" }}>Crie templates para registrar treinos rapidamente.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {templates.map(t => (
            <div key={t.id} className="oh-glass" style={{ padding: "12px 16px", borderRadius: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: "var(--oh-accent-soft)", border: "1px solid var(--oh-border)",
                display: "grid", placeItems: "center", fontSize: 18,
              }}>📋</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 2 }}>
                  Último uso: {fmtDate(t.loggedAt)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
                <button
                  onClick={() => handleLog(t.id)}
                  disabled={loggingId === t.id}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 8,
                    background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
                    border: "none", cursor: loggingId === t.id ? "not-allowed" : "pointer",
                    fontSize: 12, fontWeight: 600, opacity: loggingId === t.id ? 0.7 : 1,
                  }}
                >
                  <Play size={11} /> {loggingId === t.id ? "..." : "Treinar"}
                </button>
                <button
                  onClick={() => setEditTemplate(t)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)", padding: 4 }}
                >
                  <Pencil size={13} />
                </button>
                {confirmDelete === t.id ? (
                  <span style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleDelete(t.id)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--oh-danger)", color: "#fff", border: "none", cursor: "pointer" }}>Excluir</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "var(--oh-bg-3)", color: "var(--oh-fg-3)", border: "1px solid var(--oh-border)", cursor: "pointer" }}>Cancelar</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-4)", padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewWorkoutDialog
        open={showCreate}
        defaultTemplate
        bodyWeightKg={bodyWeightKg}
        onClose={() => setShowCreate(false)}
        onSaved={() => { setVersion(v => v + 1); setShowCreate(false); }}
      />

      {editTemplate && (
        <NewWorkoutDialog
          open
          initialSession={editTemplate}
          bodyWeightKg={bodyWeightKg}
          onClose={() => setEditTemplate(null)}
          onSaved={() => { setVersion(v => v + 1); setEditTemplate(null); }}
        />
      )}
    </div>
  );
}
