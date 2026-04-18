"use client";

import { useState, useMemo, useEffect } from "react";
import { Flame } from "lucide-react";
import { api, type DailyNutrition } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { DailyTargets } from "./settings-section";

type HistoryDay = {
  date: Date; kcal: number; prot: number; carb: number; fat: number;
  meals: number; logged: boolean;
};

function buildHistoryFromApi(data: DailyNutrition[], days: number): HistoryDay[] {
  const map = new Map(data.map(d => [d.date, d]));
  const today = new Date();
  const out: HistoryDay[] = [];
  for (let i = days; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const entry = map.get(key);
    out.push({
      date: d,
      kcal: entry?.kcal ?? 0,
      prot: entry?.prot ?? 0,
      carb: entry?.carb ?? 0,
      fat:  entry?.fat  ?? 0,
      meals: entry?.meals ?? 0,
      logged: !!entry,
    });
  }
  return out;
}

function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

/* ── Formatters ─────────────────────────────────────────── */
const fmtMonth = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
const fmtShortDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

const bestDayOfWeek = (windowed: ReturnType<typeof buildHistory>, target: number) => {
  const byDow = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  windowed.filter(d => d.logged).forEach(d => {
    byDow[d.date.getDay()].sum += Math.abs(d.kcal - target);
    byDow[d.date.getDay()].n++;
  });
  const avgs = byDow.map((b, i) => ({ dow: i, avg: b.n ? b.sum / b.n : Infinity }));
  avgs.sort((a, b) => a.avg - b.avg);
  const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  return `Você acerta a meta com mais frequência nas ${names[avgs[0].dow]}s. Um bom modelo para replicar.`;
};

/* ── KPI card ───────────────────────────────────────────── */
function KPI({ label, value, unit, delta, deltaFmt, hint, tone = "neutral", icon: IconComp }: {
  label: string; value: string; unit?: string;
  delta?: number; deltaFmt?: (v: number) => string;
  hint?: string; tone?: "neutral" | "good" | "warn" | "bad" | "accent";
  icon?: React.ElementType;
}) {
  const colors: Record<string, string> = {
    neutral: "var(--oh-fg-3)",
    good:    "var(--oh-success)",
    warn:    "var(--oh-warn)",
    bad:     "var(--oh-danger)",
    accent:  "var(--oh-accent)",
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
        <span>{hint}</span>
        {delta != null && (
          <span style={{ color: delta > 0 ? "var(--oh-warn)" : "var(--oh-success)", display: "inline-flex", alignItems: "center", gap: 3 }}>
            {delta > 0 ? "▲" : "▼"} {deltaFmt ? deltaFmt(delta) : Math.round(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Legend ─────────────────────────────────────────────── */
function Legend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean; swatch?: string }> }) {
  return (
    <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {it.swatch === "dot"
            ? <span style={{ width: 6, height: 6, borderRadius: 6, background: it.color, display: "inline-block" }} />
            : it.dashed
              ? <span style={{ width: 14, height: 0, borderTop: `1px dashed ${it.color}`, display: "inline-block" }} />
              : <span style={{ width: 14, height: 2, background: it.color, borderRadius: 2, display: "inline-block" }} />}
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Line chart ─────────────────────────────────────────── */
function LineChart({ data, target }: { data: HistoryDay[]; target: number }) {
  const W = 1000, H = 180, pad = { t: 14, r: 8, b: 22, l: 36 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;
  const values = data.map(d => d.kcal);
  const max = Math.max(...values, target) * 1.15;
  const min = 0;

  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.kcal).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1).toFixed(1)},${pad.t + innerH} L${x(0).toFixed(1)},${pad.t + innerH} Z`;

  const ticks = [0, Math.round(max * 0.33), Math.round(max * 0.66), Math.round(max)].map(v => Math.round(v / 100) * 100);

  const months: Array<{ i: number; label: string }> = [];
  let lastMonth = -1;
  data.forEach((d, i) => {
    if (d.date.getMonth() !== lastMonth) {
      months.push({ i, label: fmtMonth(d.date) });
      lastMonth = d.date.getMonth();
    }
  });

  const [hover, setHover] = useState<number | null>(null);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((px - pad.l) / innerW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setHover(idx);
        }}
      >
        <defs>
          <linearGradient id="oh-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--oh-fg)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--oh-fg)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--oh-border)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 3} fill="var(--oh-fg-4)" fontSize="10" fontFamily="var(--font-geist-mono)" textAnchor="end">{t}</text>
          </g>
        ))}

        <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="var(--oh-fg-4)" strokeWidth="1" strokeDasharray="4 4" />
        <path d={area} fill="url(#oh-area-grad)" />
        <path d={path} fill="none" stroke="var(--oh-fg)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => {
          if (Math.abs(d.kcal - target) / target > 0.1) return null;
          return <circle key={i} cx={x(i)} cy={y(d.kcal)} r="2" fill="var(--oh-success)" opacity="0.8" />;
        })}

        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + innerH} stroke="var(--oh-border-strong)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(data[hover].kcal)} r="4" fill="var(--oh-bg)" stroke="var(--oh-fg)" strokeWidth="1.5" />
          </g>
        )}

        {months.map((m, i) => (
          <text key={i} x={x(m.i)} y={H - 6} fill="var(--oh-fg-4)" fontSize="10" fontFamily="var(--font-geist-mono)" textAnchor="start">
            {m.label}
          </text>
        ))}
      </svg>

      {hover != null && (
        <div style={{
          position: "absolute",
          left: `${(x(hover) / W) * 100}%`,
          top: 0,
          transform: "translate(-50%, -6px)",
          pointerEvents: "none",
          padding: "6px 9px",
          background: "var(--oh-bg-2)",
          border: "1px solid var(--oh-border-strong)",
          borderRadius: 8,
          fontSize: 11, fontFamily: "var(--font-geist-mono)",
          whiteSpace: "nowrap",
          boxShadow: "var(--oh-shadow-sm)",
        }}>
          <div style={{ color: "var(--oh-fg-3)" }}>{fmtShortDate(data[hover].date)}</div>
          <div style={{ color: "var(--oh-fg)", fontVariantNumeric: "tabular-nums" }}>{data[hover].kcal.toLocaleString("pt-BR")} kcal</div>
        </div>
      )}
    </div>
  );
}

/* ── Heatmap ─────────────────────────────────────────────── */
function Heatmap({ history, target }: { history: HistoryDay[]; target: number }) {
  const firstSunday = new Date(history[0].date);
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay());

  const cells: Array<Array<{ date: Date; data?: HistoryDay }>> = [];
  const cursor = new Date(firstSunday);
  const last = history[history.length - 1].date;
  const map = new Map(history.map(h => [h.date.toDateString(), h]));

  while (cursor <= last) {
    const row: Array<{ date: Date; data?: HistoryDay }> = [];
    for (let d = 0; d < 7; d++) {
      row.push({ date: new Date(cursor), data: map.get(cursor.toDateString()) });
      cursor.setDate(cursor.getDate() + 1);
    }
    cells.push(row);
  }

  const intensity = (d?: HistoryDay) => {
    if (!d?.logged) return 0;
    const diff = Math.abs(d.kcal - target) / target;
    if (diff <= 0.05) return 4;
    if (diff <= 0.10) return 3;
    if (diff <= 0.18) return 2;
    return 1;
  };
  const bgColor = (lv: number) => {
    if (lv === 0) return "var(--oh-bg-3)";
    if (lv === 1) return "oklch(0.40 0.03 260)";
    if (lv === 2) return "oklch(0.55 0.08 155)";
    if (lv === 3) return "oklch(0.70 0.12 155)";
    return "oklch(0.82 0.14 155)";
  };

  const [hover, setHover] = useState<(HistoryDay & { x: number; y: number }) | null>(null);

  const monthLabels: Array<{ i: number; label: string }> = [];
  let lastM = -1;
  cells.forEach((w, i) => {
    const m = w[0].date.getMonth();
    if (m !== lastM) { monthLabels.push({ i, label: fmtMonth(w[0].date) }); lastM = m; }
  });

  const numWeeks = cells.length;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {/* Month labels */}
      <div style={{
        display: "grid", gridTemplateColumns: `28px repeat(${numWeeks}, 1fr)`,
        marginBottom: 4, fontFamily: "var(--font-geist-mono)", fontSize: 10,
        color: "var(--oh-fg-4)", textTransform: "uppercase",
      }}>
        <span />
        {cells.map((w, i) => {
          const ml = monthLabels.find(m => m.i === i);
          return <span key={i}>{ml ? ml.label : ""}</span>;
        })}
      </div>

      {/* Grid */}
      <div style={{ display: "flex", gap: 4, width: "100%" }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 9, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", width: 24, flexShrink: 0 }}>
          {["", "Seg", "", "Qua", "", "Sex", ""].map((lbl, i) => (
            <span key={i} style={{ height: 13, lineHeight: "13px", display: "block" }}>{lbl}</span>
          ))}
        </div>
        {/* Week columns */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${numWeeks}, 1fr)`,
          gap: 3,
          flex: 1,
        }}>
          {cells.map((w, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {w.map((c, j) => {
                const lv = intensity(c.data);
                return (
                  <div key={j}
                    onMouseEnter={() => c.data && setHover({ ...c.data, x: i, y: j })}
                    onMouseLeave={() => setHover(null)}
                    style={{
                      aspectRatio: "1", borderRadius: 3,
                      background: bgColor(lv),
                      border: `1px solid ${lv === 0 ? "var(--oh-border)" : "oklch(1 0 0 / 0.04)"}`,
                      cursor: c.data ? "pointer" : "default",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 10, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map(l => (
          <span key={l} style={{ width: 10, height: 10, borderRadius: 2, background: bgColor(l), border: "1px solid var(--oh-border)", display: "inline-block" }} />
        ))}
        <span>Mais próximo da meta</span>
      </div>

      {hover && (
        <div style={{
          position: "absolute", pointerEvents: "none", top: -40,
          left: `calc(28px + ${hover.x / numWeeks * 100}%)`,
          padding: "6px 9px",
          background: "var(--oh-bg-2)",
          border: "1px solid var(--oh-border-strong)",
          borderRadius: 8,
          fontSize: 11, fontFamily: "var(--font-geist-mono)",
          whiteSpace: "nowrap",
          zIndex: 10,
        }}>
          <div style={{ color: "var(--oh-fg-3)" }}>{fmtShortDate(hover.date)}</div>
          <div style={{ color: "var(--oh-fg)" }}>{hover.kcal.toLocaleString("pt-BR")} kcal</div>
        </div>
      )}
    </div>
  );
}

/* ── Macro mix donut ─────────────────────────────────────── */
function MacroMix({ windowed }: { windowed: HistoryDay[] }) {
  const logged = windowed.filter(d => d.logged);
  const n = Math.max(1, logged.length);
  const sum = logged.reduce((a, d) => ({ prot: a.prot + d.prot, carb: a.carb + d.carb, fat: a.fat + d.fat }), { prot: 0, carb: 0, fat: 0 });
  const kcalProt = sum.prot * 4 / n * n;
  const kcalCarb = sum.carb * 4 / n * n;
  const kcalFat  = sum.fat  * 9 / n * n;
  const total = (kcalProt + kcalCarb + kcalFat) || 1;

  const R = 60, S = 14, C = 2 * Math.PI * R;
  const segments = [
    { label: "Proteína",    v: kcalProt, color: "var(--oh-protein)", g: Math.round(sum.prot / n) },
    { label: "Carboidrato", v: kcalCarb, color: "var(--oh-carbs)",   g: Math.round(sum.carb / n) },
    { label: "Gordura",     v: kcalFat,  color: "var(--oh-fat)",     g: Math.round(sum.fat  / n) },
  ];

  let offset = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <g transform="translate(80,80) rotate(-90)">
          <circle r={R} fill="none" stroke="var(--oh-bg-3)" strokeWidth={S} />
          {segments.map((s, i) => {
            const frac = s.v / total;
            const dash = frac * C;
            const el = (
              <circle key={i} r={R} fill="none" stroke={s.color} strokeWidth={S}
                strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
                strokeLinecap="butt" />
            );
            offset += dash;
            return el;
          })}
        </g>
      </svg>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: s.color, display: "inline-block" }} />
              <span style={{ color: "var(--oh-fg-2)" }}>{s.label}</span>
            </div>
            <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)", fontVariantNumeric: "tabular-nums" }}>
              {Math.round((s.v / total) * 100)}% · {s.g}g/dia
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Monthly table ───────────────────────────────────────── */
function MonthlyTable({ history, target }: { history: HistoryDay[]; target: number }) {
  const byMonth: Record<string, { key: string; date: Date; days: HistoryDay[] }> = {};
  history.forEach(d => {
    const k = `${d.date.getFullYear()}-${d.date.getMonth()}`;
    if (!byMonth[k]) byMonth[k] = { key: k, date: new Date(d.date.getFullYear(), d.date.getMonth(), 1), days: [] };
    byMonth[k].days.push(d);
  });
  const rows = Object.values(byMonth).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 6);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 1.5fr 0.6fr",
        gap: 16, padding: "8px 0",
        fontSize: 10.5, fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-4)",
        textTransform: "uppercase", letterSpacing: "0.1em",
        borderBottom: "1px solid var(--oh-border)",
      }}>
        <span>Mês</span>
        <span style={{ textAlign: "right" }}>Média kcal</span>
        <span style={{ textAlign: "right" }}>Proteína</span>
        <span style={{ textAlign: "right" }}>Registros</span>
        <span>Aderência</span>
        <span style={{ textAlign: "right" }}>Δ meta</span>
      </div>
      {rows.map((r, i) => {
        const logged = r.days.filter(d => d.logged);
        const avg = logged.reduce((s, d) => s + d.kcal, 0) / Math.max(1, logged.length);
        const avgProt = logged.reduce((s, d) => s + d.prot, 0) / Math.max(1, logged.length);
        const adh = Math.round((logged.length / r.days.length) * 100);
        const delta = avg - target;
        return (
          <div key={r.key} style={{
            display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr 1.5fr 0.6fr",
            gap: 16, padding: "12px 0", alignItems: "center",
            borderBottom: i < rows.length - 1 ? "1px solid var(--oh-border)" : "none",
            fontSize: 13, fontVariantNumeric: "tabular-nums",
          }}>
            <span style={{ fontWeight: 500, textTransform: "capitalize", color: "var(--oh-fg)" }}>
              {r.date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
            <span style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg)" }}>{Math.round(avg).toLocaleString("pt-BR")}</span>
            <span style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)" }}>{Math.round(avgProt)}g</span>
            <span style={{ textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)" }}>{logged.length}/{r.days.length}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 6, background: "var(--oh-bg-3)", overflow: "hidden" }}>
                <div style={{
                  width: `${adh}%`, height: "100%",
                  background: adh >= 80 ? "var(--oh-success)" : adh >= 60 ? "var(--oh-warn)" : "var(--oh-danger)",
                  borderRadius: 6, transition: "width 0.4s",
                }} />
              </div>
              <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)", width: 32, textAlign: "right" }}>{adh}%</span>
            </div>
            <span style={{
              textAlign: "right", fontFamily: "var(--font-geist-mono)",
              color: Math.abs(delta) < 100 ? "var(--oh-success)" : delta > 0 ? "var(--oh-warn)" : "var(--oh-fg-3)",
            }}>
              {delta > 0 ? "+" : ""}{Math.round(delta)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Insight card ───────────────────────────────────────── */
function Insight({ icon: IconComp, tone, title, body }: {
  icon: React.ElementType; tone: "good" | "warn" | "accent";
  title: string; body: string;
}) {
  const tones: Record<string, { color: string; bg: string; border: string }> = {
    good:   { color: "var(--oh-success)", bg: "oklch(0.4 0.08 155 / 0.12)", border: "oklch(0.6 0.14 155 / 0.25)" },
    warn:   { color: "var(--oh-warn)",    bg: "oklch(0.4 0.08 75 / 0.12)",  border: "oklch(0.6 0.14 75 / 0.25)" },
    accent: { color: "var(--oh-accent)",  bg: "var(--oh-accent-soft)",      border: "var(--oh-border-strong)" },
  };
  const t = tones[tone];
  return (
    <div className="oh-glass" style={{ padding: 16, borderRadius: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: t.bg, border: `1px solid ${t.border}`,
        display: "grid", placeItems: "center", color: t.color,
      }}>
        <IconComp size={14} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--oh-fg)" }}>{title}</span>
        <span style={{ fontSize: 12.5, color: "var(--oh-fg-3)", lineHeight: 1.5 }}>{body}</span>
      </div>
    </div>
  );
}

/* ── Tabs ────────────────────────────────────────────────── */
type RangeId = "7" | "30" | "90" | "180";

function RangeTabs({ value, onChange }: { value: RangeId; onChange: (v: RangeId) => void }) {
  const tabs: Array<{ id: RangeId; label: string }> = [
    { id: "7",   label: "7 dias" },
    { id: "30",  label: "30 dias" },
    { id: "90",  label: "3 meses" },
    { id: "180", label: "6 meses" },
  ];
  return (
    <div style={{ position: "relative", display: "inline-flex", padding: 4, background: "var(--oh-bg-2)", border: "1px solid var(--oh-border)", borderRadius: 12, gap: 2 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{
            padding: "7px 14px", border: "none",
            background: value === t.id ? "var(--oh-bg-3)" : "transparent",
            color: value === t.id ? "var(--oh-fg)" : "var(--oh-fg-3)",
            fontSize: 13, fontWeight: 500, borderRadius: 9,
            cursor: "pointer", transition: "all 0.2s",
            outline: value === t.id ? "1px solid var(--oh-border-strong)" : "none",
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export function OverviewSection({ targets, onGoToToday }: { targets: DailyTargets; onGoToToday?: () => void }) {
  const [range, setRange] = useState<RangeId>("30");
  const [apiData, setApiData] = useState<DailyNutrition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 180);
    setLoading(true);
    api.nutrition.daily({ from: isoDate(from), to: isoDate(today) })
      .then(d => { setApiData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const history = useMemo(() => buildHistoryFromApi(apiData, 180), [apiData]);
  const days = parseInt(range, 10);
  const windowed = useMemo(() => history.slice(-days), [history, days]);

  const stats = useMemo(() => {
    const loggedDays = windowed.filter(d => d.logged);
    const avg = (k: keyof HistoryDay) => loggedDays.reduce((s, d) => s + (d[k] as number), 0) / Math.max(1, loggedDays.length);
    const avgKcal = avg("kcal");
    const avgProt = avg("prot");
    const withinTarget = loggedDays.filter(d => Math.abs(d.kcal - targets.kcal) / targets.kcal <= 0.1).length;
    const adherencePct = Math.round((loggedDays.length / windowed.length) * 100);
    const targetHitPct = Math.round((withinTarget / Math.max(1, loggedDays.length)) * 100);

    const half = Math.floor(windowed.length / 2);
    const prev = windowed.slice(0, half).filter(d => d.logged);
    const curr = windowed.slice(half).filter(d => d.logged);
    const prevAvg = prev.reduce((s, d) => s + d.kcal, 0) / Math.max(1, prev.length);
    const currAvg = curr.reduce((s, d) => s + d.kcal, 0) / Math.max(1, curr.length);
    const deltaKcal = currAvg - prevAvg;

    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].logged) streak++; else break;
    }

    return { avgKcal, avgProt, adherencePct, targetHitPct, deltaKcal, streak, loggedDays: loggedDays.length };
  }, [windowed, history, targets]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Skeleton className="h-8 w-48 rounded-lg" style={{ background: "var(--oh-bg-3)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-[14px]" style={{ background: "var(--oh-bg-3)" }} />)}
        </div>
        <Skeleton className="h-52 w-full rounded-[18px]" style={{ background: "var(--oh-bg-3)" }} />
        <Skeleton className="h-64 w-full rounded-[18px]" style={{ background: "var(--oh-bg-3)" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--oh-fg)" }}>Panorama</h2>
          <span style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
            {fmtShortDate(windowed[0].date)} — {fmtShortDate(windowed[windowed.length - 1].date)}
          </span>
        </div>
        <RangeTabs value={range} onChange={setRange} />
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KPI label="Média diária" value={Math.round(stats.avgKcal).toLocaleString("pt-BR")} unit="kcal"
          delta={stats.deltaKcal} deltaFmt={v => `${v > 0 ? "+" : ""}${Math.round(v)} kcal`}
          hint="vs período anterior" />
        <KPI label="Proteína média" value={`${Math.round(stats.avgProt)}`} unit="g/dia"
          hint={`meta ${targets.prot}g`} tone={stats.avgProt >= targets.prot * 0.9 ? "good" : "warn"} />
        <KPI label="Aderência" value={`${stats.adherencePct}%`}
          hint={`${stats.loggedDays} de ${windowed.length} dias registrados`}
          tone={stats.adherencePct >= 80 ? "good" : stats.adherencePct >= 60 ? "warn" : "bad"} />
        <KPI label="Sequência" value={`${stats.streak}`} unit="dias"
          hint="registrando sem falhar" tone="accent" icon={Flame} />
      </div>

      {/* Line chart */}
      <div className="oh-glass" style={{ padding: 22, borderRadius: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Calorias por dia</div>
            <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 2 }}>
              Linha horizontal = meta de {targets.kcal.toLocaleString("pt-BR")} kcal
            </div>
          </div>
          <Legend items={[
            { label: "Consumido",           color: "var(--oh-fg)" },
            { label: "Meta",                color: "var(--oh-fg-4)", dashed: true },
            { label: "Dentro da faixa ±10%", color: "var(--oh-success)", swatch: "dot" },
          ]} />
        </div>
        <LineChart data={windowed} target={targets.kcal} />
      </div>

      {/* Heatmap + macro mix */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: 16 }}>
        <div className="oh-glass" style={{ padding: 22, borderRadius: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Consistência</div>
              <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 2 }}>
                Cada quadrado é um dia · mais escuro = mais próximo da meta
              </div>
            </div>
            <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>
              {stats.targetHitPct}% dentro da faixa
            </span>
          </div>
          <Heatmap history={history.slice(-182)} target={targets.kcal} />
        </div>

        <div className="oh-glass" style={{ padding: 22, borderRadius: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Mix de macros médio</div>
            <div style={{ fontSize: 12, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", marginTop: 2 }}>
              Últimos {days} dias registrados
            </div>
          </div>
          <MacroMix windowed={windowed} />
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="oh-glass" style={{ padding: 22, borderRadius: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Resumo por mês</div>
          {onGoToToday && (
            <button onClick={onGoToToday}
              style={{ background: "transparent", border: "1px solid var(--oh-border)", borderRadius: 8, padding: "5px 10px", fontSize: 12.5, color: "var(--oh-fg-3)", cursor: "pointer", fontFamily: "var(--font-geist-sans)" }}>
              Ir para Hoje →
            </button>
          )}
        </div>
        <MonthlyTable history={history} target={targets.kcal} />
      </div>

      {/* Insights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <Insight icon={Flame} tone="good"
          title="Tendência positiva"
          body={`Sua média ${Math.abs(Math.round(stats.deltaKcal)) > 5 ? `${stats.deltaKcal < 0 ? "caiu" : "subiu"} ${Math.abs(Math.round(stats.deltaKcal))} kcal/dia` : "se manteve estável"} vs o período anterior.`} />
        <Insight icon={Flame} tone="accent"
          title="Dia mais consistente"
          body={bestDayOfWeek(windowed, targets.kcal)} />
        <Insight icon={Flame} tone="warn"
          title="Atenção aos fins de semana"
          body="Domingo tem tendência acima da meta. Considere pratos mais leves no jantar." />
      </div>
    </div>
  );
}
