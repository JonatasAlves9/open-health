"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";

const MUSCLE_GROUPS = [
  "peito", "costas", "ombros", "braços", "pernas", "core", "glúteos", "cardio", "outro",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 9,
  border: "1px solid var(--oh-border)",
  background: "var(--oh-bg-3)", color: "var(--oh-fg)", fontSize: 13.5,
  fontFamily: "var(--font-geist-sans)", width: "100%", outline: "none",
};

export function ExerciseFormDialog({ open, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("outro");
  const [equipment, setEquipment] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome obrigatório"); return; }
    setSaving(true);
    setError(null);
    try {
      await api.exercises.create({ name: name.trim(), muscleGroup, equipment: equipment || undefined, description: description || undefined });
      setName(""); setMuscleGroup("outro"); setEquipment(""); setDescription("");
      onSaved();
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
          width: "100%", maxWidth: 480,
          background: "var(--oh-bg-2)",
          border: "1px solid var(--oh-border-strong)",
          borderRadius: "18px 18px 0 0",
          padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
          display: "flex", flexDirection: "column", gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--oh-fg)" }}>Novo exercício</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--oh-fg-3)", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--oh-fg-4)", display: "block", marginBottom: 5, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Supino reto" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--oh-fg-4)", display: "block", marginBottom: 5, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Grupo muscular</label>
            <select value={muscleGroup} onChange={e => setMuscleGroup(e.target.value)} style={{ ...inputStyle }}>
              {MUSCLE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--oh-fg-4)", display: "block", marginBottom: 5, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Equipamento</label>
            <input value={equipment} onChange={e => setEquipment(e.target.value)} placeholder="ex: Barra, Haltere, Máquina..." style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "var(--oh-fg-4)", display: "block", marginBottom: 5, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Instruções de execução (opcional)"
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        {error && <div style={{ fontSize: 12.5, color: "var(--oh-danger)", fontFamily: "var(--font-geist-mono)" }}>{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "11px", borderRadius: 10,
            background: "var(--oh-accent)", color: "var(--oh-accent-fg)",
            border: "none", cursor: saving ? "not-allowed" : "pointer",
            fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : "Criar exercício"}
        </button>
      </div>
    </div>
  );
}
