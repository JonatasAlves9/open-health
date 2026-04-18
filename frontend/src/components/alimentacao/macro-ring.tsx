"use client";

type Props = { consumed: number; target: number; size?: number; stroke?: number };

export function MacroRing({ consumed, target, size = 160, stroke = 12 }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(consumed / (target || 1), 1.2);
  const dash = c * pct;
  const over = consumed > target;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--oh-fg)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--oh-fg-3)" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--oh-bg-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={over ? "var(--oh-danger)" : "url(#ringGrad)"}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <div style={{ fontSize: 10, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Consumido
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: "var(--oh-fg)" }}>
          {Math.round(consumed).toLocaleString("pt-BR")}
        </div>
        <div style={{ fontSize: 11, color: "var(--oh-fg-3)", fontFamily: "var(--font-geist-mono)" }}>
          / {target.toLocaleString("pt-BR")} kcal
        </div>
      </div>
    </div>
  );
}
