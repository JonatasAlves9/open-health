"use client";

export interface DailyTargets {
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
}

export const DEFAULT_TARGETS: DailyTargets = { kcal: 2200, prot: 140, carb: 260, fat: 70 };

const PRESETS = [
  { id: "cut",  label: "Cutting",      kcal: 1800, prot: 150, carb: 180, fat: 55,  sub: "Déficit moderado" },
  { id: "main", label: "Manutenção",   kcal: 2200, prot: 140, carb: 260, fat: 70,  sub: "Equilíbrio" },
  { id: "bulk", label: "Bulk leve",    kcal: 2700, prot: 160, carb: 330, fat: 80,  sub: "Superávit controlado" },
];

interface Props {
  targets: DailyTargets;
  onChange: (t: DailyTargets) => void;
  onReset: () => void;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px",
      background: "var(--oh-bg-3)", color: "var(--oh-fg-3)",
      border: "1px solid var(--oh-border)",
      borderRadius: 6, fontSize: 10.5, fontWeight: 500,
      fontFamily: "var(--font-geist-mono)", letterSpacing: "0.04em",
    }}>{children}</span>
  );
}

interface TargetFieldProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color?: string;
  onChange: (v: number) => void;
}

function TargetField({ label, unit, value, min, max, step, color, onChange }: TargetFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {color && <span style={{ width: 8, height: 8, borderRadius: 8, background: color, display: "inline-block" }} />}
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--oh-fg-2)" }}>{label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}>
          <input
            type="number" value={value} min={min} max={max} step={step}
            onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
            style={{
              width: 76, padding: "5px 8px", textAlign: "right",
              background: "var(--oh-bg-2)", border: "1px solid var(--oh-border)", borderRadius: 7,
              color: "var(--oh-fg)", fontSize: 13, fontFamily: "var(--font-geist-mono)", outline: "none",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--oh-fg-4)" }}>{unit}</span>
        </div>
      </div>
      <input
        type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color ?? "var(--oh-fg)" }}
      />
    </div>
  );
}

export function SettingsSection({ targets, onChange, onReset }: Props) {
  const update = (k: keyof DailyTargets, v: number) => onChange({ ...targets, [k]: Math.max(0, v) });

  const macroKcal = {
    prot: targets.prot * 4,
    carb: targets.carb * 4,
    fat: targets.fat * 9,
  };
  const macroTotal = macroKcal.prot + macroKcal.carb + macroKcal.fat || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Presets */}
      <div className="oh-glass" style={{ padding: 20, borderRadius: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Presets rápidos</span>
          <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>Aplica e você pode ajustar depois</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          {PRESETS.map(p => (
            <button key={p.id}
              onClick={() => onChange({ kcal: p.kcal, prot: p.prot, carb: p.carb, fat: p.fat })}
              style={{
                padding: 14, borderRadius: 12,
                background: "var(--oh-bg-3)", border: "1px solid var(--oh-border)",
                color: "var(--oh-fg)", textAlign: "left", cursor: "pointer",
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", gap: 6,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--oh-border-strong)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--oh-border)";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{p.label}</span>
                <Chip>{p.kcal} kcal</Chip>
              </div>
              <div style={{ fontSize: 11, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums" }}>
                {p.prot}P · {p.carb}C · {p.fat}G
              </div>
              <div style={{ fontSize: 11.5, color: "var(--oh-fg-4)" }}>{p.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor + Distribution */}
      <div className="oh-glass" style={{ padding: 20, borderRadius: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--oh-fg)" }}>Metas diárias</span>
            <button onClick={onReset} style={{
              background: "transparent", border: "none",
              color: "var(--oh-fg-3)", fontSize: 11.5, cursor: "pointer", fontFamily: "var(--font-geist-mono)",
            }}>Restaurar padrão</button>
          </div>
          <TargetField label="Calorias"    unit="kcal" value={targets.kcal} min={800}  max={5000} step={50} onChange={v => update("kcal", v)} />
          <TargetField label="Proteína"    unit="g"    value={targets.prot} min={30}   max={300}  step={5}  color="var(--oh-protein)" onChange={v => update("prot", v)} />
          <TargetField label="Carboidrato" unit="g"    value={targets.carb} min={30}   max={500}  step={5}  color="var(--oh-carbs)"   onChange={v => update("carb", v)} />
          <TargetField label="Gordura"     unit="g"    value={targets.fat}  min={20}   max={200}  step={5}  color="var(--oh-fat)"     onChange={v => update("fat",  v)} />
        </div>

        {/* Macro distribution */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 14,
          padding: 16, background: "var(--oh-bg-3)",
          border: "1px solid var(--oh-border)", borderRadius: 12,
        }}>
          <div style={{ fontSize: 12, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Distribuição energética
          </div>

          {/* Stacked bar */}
          <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ width: `${(macroKcal.prot / macroTotal) * 100}%`, background: "var(--oh-protein)", transition: "width 0.4s" }} />
            <div style={{ width: `${(macroKcal.carb / macroTotal) * 100}%`, background: "var(--oh-carbs)",   transition: "width 0.4s" }} />
            <div style={{ width: `${(macroKcal.fat  / macroTotal) * 100}%`, background: "var(--oh-fat)",     transition: "width 0.4s" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Proteína",    color: "var(--oh-protein)", v: macroKcal.prot, g: targets.prot },
              { label: "Carboidrato", color: "var(--oh-carbs)",   v: macroKcal.carb, g: targets.carb },
              { label: "Gordura",     color: "var(--oh-fat)",     v: macroKcal.fat,  g: targets.fat  },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 8, background: row.color, display: "inline-block" }} />
                  <span style={{ color: "var(--oh-fg-2)" }}>{row.label}</span>
                </div>
                <span style={{ fontFamily: "var(--font-geist-mono)", color: "var(--oh-fg-3)", fontVariantNumeric: "tabular-nums" }}>
                  {row.g}g · {Math.round(row.v)} kcal · {Math.round((row.v / macroTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>

          {/* Totals check */}
          <div style={{
            marginTop: 4, padding: "8px 10px",
            background: "var(--oh-bg-2)", border: "1px solid var(--oh-border)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 11.5, fontFamily: "var(--font-geist-mono)", fontVariantNumeric: "tabular-nums",
          }}>
            <span style={{ color: "var(--oh-fg-4)" }}>SOMA DOS MACROS</span>
            <span style={{ color: Math.abs(macroTotal - targets.kcal) > 100 ? "var(--oh-warn)" : "var(--oh-success)" }}>
              {Math.round(macroTotal)} kcal {macroTotal > targets.kcal ? "↑" : "↓"} alvo {targets.kcal}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
