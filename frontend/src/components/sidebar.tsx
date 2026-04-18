"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, Activity, Dumbbell, Settings } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alimentacao", label: "Alimentação", icon: Utensils },
  { href: "/saude", label: "Saúde", icon: Activity },
  { href: "/exercicios", label: "Exercícios", icon: Dumbbell },
];

const LogoMark = () => (
  <div style={{
    width: 26, height: 26, borderRadius: 9,
    background: "linear-gradient(135deg, var(--oh-fg) 0%, var(--oh-fg-3) 100%)",
    display: "grid", placeItems: "center",
    boxShadow: "0 2px 8px oklch(0 0 0 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.15)",
    flexShrink: 0,
  }}>
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--oh-bg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5-9-10a5 5 0 019-3 5 5 0 019 3c-2 5-9 10-9 10z" />
    </svg>
  </div>
);

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 240, minWidth: 240,
      padding: "22px 18px",
      borderRight: "1px solid var(--oh-border)",
      background: "var(--oh-surface)",
      backdropFilter: "blur(24px) saturate(140%)",
      WebkitBackdropFilter: "blur(24px) saturate(140%)",
      display: "flex", flexDirection: "column", gap: 24,
      position: "sticky", top: 0, height: "100vh",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px" }}>
        <LogoMark />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--oh-fg)" }}>Open Health</span>
          <span style={{ fontSize: 11, color: "var(--oh-fg-4)", fontFamily: "var(--font-geist-mono)" }}>v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "9px 12px",
              borderRadius: 10,
              border: "1px solid transparent",
              background: isActive ? "var(--oh-accent-soft)" : "transparent",
              color: isActive ? "var(--oh-fg)" : "var(--oh-fg-3)",
              fontSize: 13.5, fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.15s ease",
              position: "relative",
            }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--oh-bg-3)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {isActive && (
                <span style={{
                  position: "absolute", left: -18, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 18, borderRadius: 2, background: "var(--oh-fg)",
                }} />
              )}
              <Icon size={17} style={{ opacity: isActive ? 1 : 0.75 }} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          padding: "12px 14px", borderRadius: 12,
          background: "var(--oh-bg-2)", border: "1px solid var(--oh-border)",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--oh-fg-3)", fontSize: 11, fontFamily: "var(--font-geist-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <span style={{ width: 6, height: 6, borderRadius: 6, background: "var(--oh-success)", boxShadow: "0 0 8px var(--oh-success)", display: "inline-block" }} />
            Sincronizado
          </div>
          <div style={{ fontSize: 12, color: "var(--oh-fg-3)" }}>API conectada</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 6px" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, oklch(0.65 0.12 45), oklch(0.55 0.15 15))",
            display: "grid", placeItems: "center", color: "white", fontWeight: 600, fontSize: 12,
          }}>OH</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--oh-fg)" }}>Open Health</span>
            <span style={{ fontSize: 11, color: "var(--oh-fg-4)" }}>Pessoal</span>
          </div>
          <Settings size={15} style={{ color: "var(--oh-fg-4)", flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
