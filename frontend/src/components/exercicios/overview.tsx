"use client";

import { useState, useEffect, useMemo } from "react";
import { Flame, Zap, Calendar, TrendingUp } from "lucide-react";
import { api, type DailyWorkout, type Exercise, type WorkoutProgression } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkoutSettings } from "./settings-section";

type RangeId = "7" | "30" | "90" | "180";

type DayEntry = {
  date: Date;
  sessions: number;
  kcal: number;
  logged: boolean;
};

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const fmtMonth = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
const fmtShortDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

function buildHistory(data: DailyWorkout[], days: number): DayEntry[] {
  const map = new Map(data.map(d => [d.date, d]));
  const today = new Date();
  const out: DayEntry[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoDate(d);
    const entry = map.get(key);
    out.push({ date: d, sessions: entry?.sessions ?? 0, kcal: entry?.kcal ?? 0, logged: !!entry });
  }
  return out;
}

function RangeTabs({ value, onChange }: { value: RangeId; onChange: (v: RangeId) => void }) {
  const tabs: Array<{ id: RangeId; label: string }> = [
    { id: "7", label: "7 dias" }, { id: "30", label: "30 dias" },
    { id: "90", label: "3 meses" }, { id: "180", label: "6 meses" },
  ];
  return (
    <div style={{ display: "flex", padding: 4, background: "var(--oh-bg-2)", border: "1px solid var(--oh-border)", borderRadius: 12, gap: 2, flexWrap: "wrap" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: "6px 12px", border: "none",
          background: value === t.id ? "var(--oh-bg-3)" : "transparent",
          color: value === t.id ? "var(--oh-fg)" : "var(--oh-fg-3)",
          fontSize: 12.5, fontWeight: 500, borderRadius: 9,
          cursor: "pointer", transition: "all 0.2s",
          outline: value === t.id ? "1px solid var(--oh-border-strong)" : "none",
          whiteSpace: "nowrap",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function KPI({ label, value, unit, hint, tone = "neutral", icon: IconComp }: {
  label: string; value: string; unit?: string; hint?: string;
  tone?: "neutral" | "good" | "warn" | "accent"; icon?: React.ElementType;
}) {
  const colors: Record<string, string> = {
    neutral: "var(--oh-fg-3)", good: "var(--oh-success)", warn: "var(--oh-warn)", accent: "var(--oh-accent)",
  };
  const c = colors[tone];
  return (
    <div className="oh-glass" style={{ padding: 16, borderRadius: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--oh-fg-3)", fontSize: 11, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {IconComp && <IconComp size={12} style={{ color: c }} />}
        <span>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "var(--oh-fg)" }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>{unit}</span>}
      </div>
      {hint && <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>{hint}</span>}
    </div>
  );
}

function WorkoutHeatmap({ history }: { history: DayEntry[] }) {
  const firstSunday = new Date(history[0].date);
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

  const cells: Array<Array<{ date: Date; data?: DayEntry }>> = [];
  const cursor = new Date(firstSunday);
  const last = history[history.length - 1].date;
  const map = new Map(history.map(h => [h.date.toDateString(), h]));

  while (cursor <= last) {
    const row: Array<{ date: Date; data?: DayEntry }> = [];
    for (let d = 0; d < 7; d++) {
      row.push({ date: new Date(cursor), data: map.get(cursor.toDateString()) });
      cursor.setDate(cursor.getDate() + 1);
    }
    cells.push(row);
  }

  const bgColor = (d?: DayEntry) => {
    if (!d?.logged) return "var(--oh-bg-3)";
    if (d.sessions >= 2) return "oklch(0.82 0.14 155)";
    if (d.kcal > 400) return "oklch(0.70 0.12 155)";
    if (d.kcal > 200) return "oklch(0.55 0.08 155)";
    return "oklch(0.40 0.03 260)";
  };

  const [hover, setHover] = useState<(DayEntry & { x: number }) | null>(null);
  const numWeeks = cells.length;

  const monthLabels: Array<{ i: number; label: string }> = [];
  let lastM = -1;
  cells.forEach((w, i) => {
    const m = w[0].date.getMonth();
    if (m !== lastM) { monthLabels.push({ i, label: fmtMonth(w[0].date) }); lastM = m; }
  });

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: `28px repeat(${numWeeks}, 1fr)`, marginBottom: 4, fontFamily: "var(--font-geist-mono)", fontSize: 10, color: "var(--oh-fg-4)", textTransform: "uppercase" }}>
        <span />
        {cells.map((w, i) => {
          const ml = monthLabels.find(m => m.i === i);
          return <span key={i}>{ml ? ml.label : ""}</span>;
        })}
      </div>
      <div style={{ display: "flex", gap: 4, width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 9, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", width: 24, flexShrink: 0 }}>
          {["", "Seg", "", "Qua", "", "Sex", ""].map((lbl, i) => (
            <span key={i} style={{ height: 13, lineHeight: "13px", display: "block" }}>{lbl}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${numWeeks}, 1fr)`, gap: 3, flex: 1 }}>
          {cells.map((w, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {w.map((c, j) => (
                <div key={j}
                  onMouseEnter={() => c.data && setHover({ ...c.data, x: i })}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    aspectRatio: "1", borderRadius: 3,
                    background: bgColor(c.data),
                    border: `1px solid ${!c.data?.logged ? "var(--oh-border)" : "oklch(1 0 0 / 0.04)"}`,
                    cursor: c.data?.logged ? "pointer" : "default",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 10, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
        <span>Sem treino</span>
        {[undefined, { logged: true, sessions: 1, kcal: 100, date: new Date() }, { logged: true, sessions: 1, kcal: 250, date: new Date() }, { logged: true, sessions: 1, kcal: 500, date: new Date() }, { logged: true, sessions: 2, kcal: 600, date: new Date() }].map((d, l) => (
          <span key={l} style={{ width: 10, height: 10, borderRadius: 2, background: bgColor(d as DayEntry | undefined), border: "1px solid var(--oh-border)", display: "inline-block" }} />
        ))}
        <span>Mais treinos</span>
      </div>
      {hover && (
        <div style={{
          position: "absolute", pointerEvents: "none", top: -40,
          left: `calc(28px + ${(hover.x / numWeeks) * 100}%)`,
          padding: "6px 9px", background: "var(--oh-bg-2)",
          border: "1px solid var(--oh-border-strong)",
          borderRadius: 8, fontSize: 11, fontFamily: "var(--font-geist-mono)",
          whiteSpace: "nowrap", zIndex: 10,
        }}>
          <div style={{ color: "var(--oh-fg-3)" }}>{fmtShortDate(hover.date)}</div>
          <div style={{ color: "var(--oh-fg)" }}>{hover.sessions} sessão{hover.sessions > 1 ? "ões" : ""} · {Math.round(hover.kcal)} kcal</div>
        </div>
      )}
    </div>
  );
}

function VolumeChart({ data }: { data: DayEntry[] }) {
  const W = 1000, H = 160, pad = { t: 10, r: 8, b: 22, l: 36 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const kcalValues = data.map(d => d.kcal);
  const max = Math.max(...kcalValues, 1) * 1.2;
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * innerW;
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.kcal).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1).toFixed(1)},${pad.t + innerH} L${x(0).toFixed(1)},${pad.t + innerH} Z`;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((px - pad.l) / innerW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
      >
        <defs>
          <linearGradient id="oh-workout-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--oh-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--oh-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#oh-workout-area-grad)" />
        <path d={path} fill="none" stroke="var(--oh-accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => d.logged ? <circle key={i} cx={x(i)} cy={y(d.kcal)} r="2.5" fill="var(--oh-accent)" opacity="0.8" /> : null)}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="var(--oh-border-strong)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(data[hover].kcal)} r="4" fill="var(--oh-bg)" stroke="var(--oh-accent)" strokeWidth="1.5" />
          </g>
        )}
      </svg>
      {hover != null && data[hover].logged && (
        <div style={{
          position: "absolute", left: `${(x(hover) / W) * 100}%`, top: 0,
          transform: "translate(-50%, -6px)", pointerEvents: "none",
          padding: "6px 9px", background: "var(--oh-bg-2)",
          border: "1px solid var(--oh-border-strong)", borderRadius: 8,
          fontSize: 11, fontFamily: "var(--font-geist-mono)", whiteSpace: "nowrap",
          boxShadow: "var(--oh-shadow-sm)",
        }}>
          <div style={{ color: "var(--oh-fg-3)" }}>{fmtShortDate(data[hover].date)}</div>
          <div style={{ color: "var(--oh-fg)" }}>{data[hover].sessions} sessão{data[hover].sessions > 1 ? "ões" : ""} · {Math.round(data[hover].kcal)} kcal</div>
        </div>
      )}
    </div>
  );
}

function ProgressionPanel() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [progression, setProgression] = useState<WorkoutProgression[]>([]);
  const [loadingEx, setLoadingEx] = useState(false);
  const [loadingProg, setLoadingProg] = useState(false);

  useEffect(() => {
    setLoadingEx(true);
    api.exercises.list().then(r => { setExercises(r.filter(e => e.source !== "cardio")); setLoadingEx(false); }).catch(() => setLoadingEx(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingProg(true);
    api.workouts.progression(selectedId).then(r => { setProgression(r); setLoadingProg(false); }).catch(() => setLoadingProg(false));
  }, [selectedId]);

  const maxWeight = progression.length ? Math.max(...progression.map(p => p.maxWeight ?? 0)) : 0;
  const latestOrm = progression.length ? progression[progression.length - 1].orm : null;

  const W = 800, H = 130, pad = { t: 8, r: 8, b: 20, l: 40 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const y = (v: number) => pad.t + innerH - (v / Math.max(1, maxWeight * 1.1)) * innerH;
  const x = (i: number) => pad.l + (i / Math.max(1, progression.length - 1)) * innerW;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={selectedId ?? ""}
          onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          style={{
            padding: "7px 12px", borderRadius: 8,
            border: "1px solid var(--oh-border)",
            background: "var(--oh-bg-3)", color: "var(--oh-fg)", fontSize: 13,
            fontFamily: "var(--font-geist-sans)", outline: "none",
          }}
        >
          <option value="">Selecione um exercício...</option>
          {exercises.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {latestOrm && (
          <span style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            1RM estimado: <strong style={{ color: "var(--oh-fg)" }}>{latestOrm}kg</strong>
          </span>
        )}
      </div>

      {loadingProg && <Skeleton className="h-32 rounded-xl" style={{ background: "var(--oh-bg-3)" }} />}

      {!loadingProg && selectedId && progression.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "var(--oh-fg-4)", fontSize: 13.5, borderRadius: 10, border: "1px dashed var(--oh-border)" }}>
          Nenhum treino registrado com este exercício ainda.
        </div>
      )}

      {!loadingProg && progression.length > 0 && (
        <div style={{ position: "relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            {progression.map((p, i) => (
              <g key={i}>
                <circle cx={x(i)} cy={y(p.maxWeight ?? 0)} r="4"
                  fill={p.maxWeight === maxWeight ? "var(--oh-warn)" : "var(--oh-accent)"}
                  stroke="var(--oh-bg)" strokeWidth="1.5"
                />
                {i > 0 && (
                  <line
                    x1={x(i - 1)} y1={y(progression[i - 1].maxWeight ?? 0)}
                    x2={x(i)} y2={y(p.maxWeight ?? 0)}
                    stroke="var(--oh-accent)" strokeWidth="1.5" opacity="0.6"
                  />
                )}
                {p.maxWeight === maxWeight && (
                  <text x={x(i)} y={y(p.maxWeight) - 8} textAnchor="middle" fill="var(--oh-warn)" fontSize="9" fontFamily="var(--font-geist-mono)">PR</text>
                )}
              </g>
            ))}
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 4 }}>
            <span>{fmtShortDate(new Date(progression[0].date))}</span>
            <span>{fmtShortDate(new Date(progression[progression.length - 1].date))}</span>
          </div>
        </div>
      )}

      {!selectedId && !loadingEx && (
        <div style={{ padding: 16, textAlign: "center", color: "var(--oh-fg-4)", fontSize: 13, borderRadius: 10, border: "1px dashed var(--oh-border)" }}>
          Selecione um exercício para ver a progressão de carga.
        </div>
      )}
    </div>
  );
}

function MonthlyTable({ history, weeklyGoal }: { history: DayEntry[]; weeklyGoal: number }) {
  const byMonth: Record<string, { key: string; date: Date; days: DayEntry[] }> = {};
  history.forEach(d => {
    const k = `${d.date.getFullYear()}-${d.date.getMonth()}`;
    if (!byMonth[k]) byMonth[k] = { key: k, date: new Date(d.date.getFullYear(), d.date.getMonth(), 1), days: [] };
    byMonth[k].days.push(d);
  });
  const rows = Object.values(byMonth).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);
  const COL = "1.2fr 0.7fr 0.7fr 0.7fr 1.4fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 420 }}>
      <div style={{ display: "grid", gridTemplateColumns: COL, gap: 12, padding: "8px 0", fontSize: 10.5, fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-4)", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid var(--oh-border)" }}>
        <span>Mês</span>
        <span style={{ textAlign: "right" }}>Sessões</span>
        <span style={{ textAlign: "right" }}>Kcal</span>
        <span style={{ textAlign: "right" }}>Dias</span>
        <span>Aderência</span>
      </div>
      {rows.map((r, i) => {
        const logged = r.days.filter(d => d.logged);
        const totalKcal = logged.reduce((s, d) => s + d.kcal, 0);
        const totalSessions = logged.reduce((s, d) => s + d.sessions, 0);
        const weeksInMonth = Math.ceil(r.days.length / 7);
        const adherence = Math.min(100, Math.round((logged.length / (weeksInMonth * weeklyGoal)) * 100));
        return (
          <div key={r.key} style={{ display: "grid", gridTemplateColumns: COL, gap: 12, padding: "12px 0", alignItems: "center", borderBottom: i < rows.length - 1 ? "1px solid var(--oh-border)" : "none", fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontWeight: 500, textTransform: "capitalize", color: "var(--oh-fg)" }}>
              {r.date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <span style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg)" }}>{totalSessions}</span>
            <span style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)" }}>{Math.round(totalKcal)}</span>
            <span style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)" }}>{logged.length}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 6, background: "var(--oh-bg-3)", overflow: "hidden" }}>
                <div style={{ width: `${adherence}%`, height: "100%", background: adherence >= 80 ? "var(--oh-success)" : adherence >= 60 ? "var(--oh-warn)" : "var(--oh-danger)", borderRadius: 6, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)", width: 32, textAlign: "right" }}>{adherence}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  settings: WorkoutSettings;
  onGoToToday?: () => void;
}

export function WorkoutOverview({ settings, onGoToToday }: Props) {
  const [range, setRange] = useState<RangeId>("30");
  const [apiData, setApiData] = useState<DailyWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 180);
    setLoading(true);
    api.workouts.daily({ from: isoDate(from), to: isoDate(today) })
      .then(d => { setApiData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const history = useMemo(() => buildHistory(apiData, 180), [apiData]);
  const days = parseInt(range, 10);
  const windowed = useMemo(() => history.slice(-days), [history, days]);

  const stats = useMemo(() => {
    const logged = windowed.filter(d => d.logged);
    const weeks = Math.ceil(windowed.length / 7);
    const perWeek = +(logged.length / Math.max(1, weeks)).toFixed(1);
    const totalKcal = logged.reduce((s, d) => s + d.kcal, 0);
    const avgKcalPerWeek = +(totalKcal / Math.max(1, weeks)).toFixed(0);
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].logged) streak++; else break;
    }
    const adherence = Math.min(100, Math.round((logged.length / (weeks * settings.weeklyGoal)) * 100));
    return { perWeek, avgKcalPerWeek, streak, adherence, logged: logged.length };
  }, [windowed, history, settings]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Skeleton className="h-8 w-48 rounded-lg" style={{ background: "var(--oh-bg-3)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-[14px]" style={{ background: "var(--oh-bg-3)" }} />)}
        </div>
        <Skeleton className="h-48 w-full rounded-[18px]" style={{ background: "var(--oh-bg-3)" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--oh-fg)" }}>Panorama</h2>
          <span style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            {fmtShortDate(windowed[0].date)} — {fmtShortDate(windowed[windowed.length - 1].date)}
          </span>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KPI label="Treinos/semana" value={String(stats.perWeek)} hint={`meta: ${settings.weeklyGoal}×/sem`} tone={stats.perWeek >= settings.weeklyGoal ? "good" : "warn"} icon={TrendingUp} />
        <KPI label="Aderência" value={`${stats.adherence}%`} hint={`${stats.logged} de ${windowed.length} dias`} tone={stats.adherence >= 80 ? "good" : stats.adherence >= 60 ? "warn" : "neutral"} />
        <KPI label="Kcal/semana" value={stats.avgKcalPerWeek.toLocaleString("pt-BR")} unit="kcal" hint="média no período" tone="neutral" icon={Flame} />
        <KPI label="Sequência" value={String(stats.streak)} unit="dias" hint="dias seguidos" tone="accent" icon={Zap} />
      </div>

      <div className="oh-glass" style={{ padding: "18px 20px", borderRadius: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", marginBottom: 6 }}>Calorias gastas por dia</div>
        <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginBottom: 14 }}>
          Últimos {days} dias
        </div>
        <VolumeChart data={windowed} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
        <div className="oh-glass" style={{ padding: "18px 20px", borderRadius: 18, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", marginBottom: 4 }}>Consistência</div>
          <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginBottom: 14 }}>
            Cada quadrado = 1 dia · mais escuro = mais treinos/kcal
          </div>
          <WorkoutHeatmap history={history.slice(-182)} />
        </div>

        <div className="oh-glass" style={{ padding: "18px 20px", borderRadius: 18, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)", marginBottom: 4 }}>Progressão por exercício</div>
          <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginBottom: 14 }}>
            Carga máxima por sessão · PR em amarelo
          </div>
          <ProgressionPanel />
        </div>
      </div>

      <div className="oh-glass" style={{ padding: "18px 20px", borderRadius: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Resumo por mês</div>
          {onGoToToday && (
            <button onClick={onGoToToday} style={{ background: "transparent", border: "1px solid var(--oh-border)", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, color: "var(--oh-fg-3)", cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}>
              Hoje →
            </button>
          )}
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          <MonthlyTable history={history} weeklyGoal={settings.weeklyGoal} />
        </div>
      </div>
    </div>
  );
}
