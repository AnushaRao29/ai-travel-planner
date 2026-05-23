// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

export const T = {
  blue:    "#378add",
  purple:  "#7c5cbf",
  green:   "#27ae60",
  amber:   "#f39c12",
  red:     "#e74c3c",
  text:    "#1a1a2e",
  muted:   "#5a6478",
  faint:   "#8a94a6",
  border:  "#e5e8ed",
  borderL: "#f0f2f5",
  surface: "#fafbfc",
  bg:      "#f4f6f9",
  white:   "#ffffff",
  radius:  14,
  radiusSm: 8,
};

// ─── SHARED CARD STYLES ───────────────────────────────────────────────────────

export const cardStyle = {
  background: T.white, border: `1px solid ${T.border}`,
  borderRadius: T.radius, overflow: "hidden",
  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
};

export const cardHeaderStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "12px 16px", borderBottom: `1px solid ${T.borderL}`,
  background: T.surface, flexWrap: "wrap",
};

export const cardLabelStyle = {
  fontSize: 11, fontWeight: 700, letterSpacing: "1.2px",
  color: T.muted, textTransform: "uppercase",
};

export const bulletLineStyle = {
  display: "flex", gap: 8, fontSize: 13.5,
  lineHeight: 1.65, color: "#2d3748", padding: "4px 0",
};

export const dividerStyle = { height: 1, background: T.borderL, margin: "8px 0" };

export const linkBtnStyle = {
  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10,
  fontSize: 12.5, color: T.blue, textDecoration: "none",
  border: "1px solid #dce8f7", borderRadius: T.radiusSm,
  padding: "7px 13px", background: "#f0f6fd", fontWeight: 500,
};

// variant: "green" | "red" | "amber"
export function badgeStyle(variant) {
  const v = { green: ["#e8f8f0","#27ae60","#a7f3d0"], red: ["#fdf0f0","#e74c3c","#fca5a5"], amber: ["#fff8e8","#b45309","#fde68a"] }[variant] || ["#e8f8f0","#27ae60","#a7f3d0"];
  return { fontSize: 10, background: v[0], color: v[1], border: `1px solid ${v[2]}`, borderRadius: 4, padding: "2px 7px", fontWeight: 600, whiteSpace: "nowrap" };
}

// ─── HERO PAGE STYLES ─────────────────────────────────────────────────────────

export const heroShell = {
  minHeight: "100vh", display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", padding: "1.5rem 1rem",
  position: "relative",
  background: "linear-gradient(160deg, #0a1628 0%, #0f2847 50%, #1a3a5c 100%)",
  overflow: "hidden",
};

export const starsStyle = {
  position: "absolute", inset: 0, pointerEvents: "none",
  backgroundImage: `
    radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 0%),
    radial-gradient(1px 1px at 22% 8%,  rgba(255,255,255,0.5) 0%, transparent 0%),
    radial-gradient(1.5px 1.5px at 38% 20%, rgba(255,255,255,0.7) 0%, transparent 0%),
    radial-gradient(1px 1px at 55% 5%,  rgba(255,255,255,0.6) 0%, transparent 0%),
    radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.4) 0%, transparent 0%),
    radial-gradient(1.5px 1.5px at 85% 10%, rgba(255,255,255,0.7) 0%, transparent 0%),
    radial-gradient(1px 1px at 18% 50%, rgba(255,255,255,0.6) 0%, transparent 0%),
    radial-gradient(1px 1px at 75% 82%, rgba(255,255,255,0.5) 0%, transparent 0%)`,
};

export const moonStyle = {
  position: "absolute", top: "8%", right: "10%", width: 80, height: 80,
  borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff9e6, #f5d78e)",
};

export const glassInput = {
  display:    "block",
  flex:       1,
  minWidth:   0,
  width:      "100%",
  background: "rgba(255,255,255,0.08)",
  border:     "0.5px solid rgba(255,255,255,0.15)",
  borderRadius: 12,
  color:      "#fff",
  fontSize:   15,
  padding:    "13px 16px",
  outline:    "none",
  fontFamily: "inherit",
  boxSizing:  "border-box",
  // Ensure button elements render correctly on iOS
  WebkitAppearance: "none",
  appearance: "none",
};

// ─── PLANNER PAGE STYLES ──────────────────────────────────────────────────────

export const ctrlInputStyle = {
  background: T.bg, border: `1px solid ${T.border}`,
  borderRadius: T.radiusSm, padding: "8px 13px",
  fontSize: 13, color: T.text, outline: "none",
};

export const ctrlBtnStyle = {
  background: "linear-gradient(135deg,#378add,#7c5cbf)", border: "none",
  borderRadius: T.radiusSm, color: "#fff", fontSize: 13,
  fontWeight: 500, padding: "8px 18px", cursor: "pointer",
};
