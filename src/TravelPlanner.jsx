import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Japan", "Singapore", "UAE", "China", "Brazil",
  "South Africa", "Mexico", "Italy", "Spain", "Netherlands", "South Korea",
  "New Zealand", "Russia", "Pakistan", "Bangladesh", "Sri Lanka", "Nepal",
];

const QUICK_PICKS = ["Paris", "Tokyo", "Bali", "New York", "Rome", "Santorini"];

const TEMPLATES = [
  { label: "💕 Romantic escape",      prompt: (d, n) => `Rewrite as a romantic couples itinerary for ${d} (${n} days).` },
  { label: "🍜 Foodie focus",         prompt: (d, n) => `Focus on food, markets, and restaurants in ${d} (${n} days).` },
  { label: "💰 Budget version",       prompt: (d, n) => `Make it a budget-friendly ${n}-day trip to ${d} with affordable options.` },
  { label: "🏔 Off the beaten path",  prompt: (d, n) => `Replace tourist traps with hidden gems and local spots in ${d} (${n} days).` },
];

const SECTION_LABELS = ["ITINERARY", "VISA", "WEATHER", "BUDGET", "TIPS"];

const SECTION_ICONS = {
  ITINERARY: "🗓",
  VISA: "🛂",
  WEATHER: "🌤",
  BUDGET: "💰",
  TIPS: "💡",
};

/* Build prompt with origin country */
function buildItineraryPrompt(dest, days, origin = "") {
  const originLine = origin ? `Traveler is from ${origin}.` : "";
  return `${originLine}
Create a detailed ${days}-day travel itinerary for ${dest}.
Format exactly like this:

ITINERARY
Day 1: [Theme]
- Morning: [activity with 1-sentence description]
- Afternoon: [activity with 1-sentence description]
- Evening: [activity with 1-sentence description]

Day 2: [Theme]
...and so on for all ${days} days.

Include a mix of iconic sights, local food experiences, and hidden gems. Keep descriptions practical and vivid.

VISA
${origin ? `Visa requirements for travelers from ${origin}` : "Visa requirements"}: Is visa-free entry available? If not, explain the process.

WEATHER
Best time to visit, climate, seasonal considerations.

BUDGET
Estimated daily budget ${origin ? `for someone from ${origin}` : ""}, cost breakdown, money-saving tips.

TIPS
Local tips, cultural notes, important things to know.`;
}

/* ─────────────────────────────────────────
   PARSE ITINERARY INTO SECTIONS
───────────────────────────────────────── */
function parseSections(text) {
  // Clean markdown artifacts
  const clean = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");

  const sections = {};
  let currentSection = null;
  let buffer = [];

  clean.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const matchedSection = SECTION_LABELS.find(
      (s) => trimmed.toUpperCase() === s
    );

    if (matchedSection) {
      if (currentSection) sections[currentSection] = buffer;
      currentSection = matchedSection;
      buffer = [];
    } else if (currentSection) {
      buffer.push(trimmed);
    }
  });

  // Push last section
  if (currentSection) sections[currentSection] = buffer;
  return sections;
}

function renderItineraryLines(lines) {
  return lines.map((line, i) => {
    if (/^Day\s+\d+/i.test(line)) {
      return <div key={i} style={styles.dayHeader}>{line}</div>;
    }
    return <div key={i} style={styles.activityLine}>{line}</div>;
  });
}

function renderBulletLines(lines) {
  return lines.map((line, i) => (
    <div key={i} style={styles.bulletLine}>
      <span style={styles.bulletDot}>·</span>
      <span>{line.replace(/^[-•]\s*/, "")}</span>
    </div>
  ));
}

/* ─────────────────────────────────────────
   SECTION CARD COMPONENT
───────────────────────────────────────── */
function SectionCard({ label, lines }) {
  if (!lines || lines.length === 0) return null;
  const isItinerary = label === "ITINERARY";

  return (
    <div style={styles.sectionCard}>
      <div style={styles.sectionCardHeader}>
        <span style={styles.sectionIcon}>{SECTION_ICONS[label]}</span>
        <span style={styles.sectionLabel}>{label}</span>
      </div>
      <div style={styles.sectionCardBody}>
        {isItinerary ? renderItineraryLines(lines) : renderBulletLines(lines)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   HERO PAGE
───────────────────────────────────────── */
function HeroPage({ onStart }) {
  const [dest, setDest] = useState("");
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState("India");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countryFilter, setCountryFilter] = useState("");

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countryFilter.toLowerCase())
  );

  const handleStart = (prefilled) => {
    const d = prefilled || dest;
    if (!d.trim()) return;
    onStart(d.trim(), days, origin);
  };

  const selectCountry = (country) => {
    setOrigin(country);
    setShowCountryDropdown(false);
    setCountryFilter("");
  };

  return (
    <div style={styles.hero}>
      <div style={styles.stars} />
      <div style={styles.moon} />
      <div style={styles.plane}>✈</div>

      <div style={styles.heroContent}>
        <div style={styles.badge}>AI Travel Planner</div>

        <h1 style={styles.heroTitle}>
          Your next trip,{" "}
          <span style={styles.heroTitleGradient}>planned in seconds</span>
        </h1>

        <p style={styles.heroSub}>
          Tell us where you're headed and how long you have.
          <br />
          We'll craft a beautiful day-by-day itinerary.
        </p>

        <div style={styles.searchCard}>
          {/* Origin country dropdown */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <button
              style={{
                width: "100%",
                ...styles.destInput,
                background: origin ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.08)",
                border: showCountryDropdown ? "0.5px solid rgba(255,255,255,0.3)" : "0.5px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                textAlign: "left",
              }}
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            >
              ✈ From: {origin}
            </button>
            {showCountryDropdown && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "#fff", border: "1px solid #dde1e8",
                borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 20, marginTop: 4, overflow: "hidden",
              }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country..."
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px",
                    border: "none", borderBottom: "1px solid #e5e8ed",
                    fontSize: 13, outline: "none",
                  }}
                />
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {filteredCountries.map((c) => (
                    <div
                      key={c}
                      style={{
                        padding: "8px 12px", fontSize: 13, cursor: "pointer",
                        borderBottom: "0.5px solid #f0f2f5",
                        background: origin === c ? "#e8f0ff" : "#fff",
                      }}
                      onClick={() => selectCountry(c)}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={styles.inputRow}>
            <input
              style={styles.destInput}
              type="text"
              placeholder="Where to? e.g. Paris, Bali, Tokyo…"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
            <input
              style={styles.daysInput}
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              title="Number of days"
            />
            <button style={styles.planBtn} onClick={() => handleStart()}>
              Plan my trip →
            </button>
          </div>
        </div>

        <div style={styles.quickPicks}>
          <span style={styles.picksLabel}>Try:</span>
          {QUICK_PICKS.map((city) => (
            <button
              key={city}
              style={styles.quickChip}
              onClick={() => { setDest(city); handleStart(city); }}
            >
              {city}
            </button>
          ))}
        </div>

        <p style={styles.footerNote}>Powered by AI</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLANNER PAGE
───────────────────────────────────────── */
function PlannerPage({ initialDest, initialDays, initialOrigin, onBack }) {
  const [dest, setDest] = useState(initialDest);
  const [days, setDays] = useState(initialDays);
  const [origin] = useState(initialOrigin);
  const [sections, setSections] = useState(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const didInit = useRef(false);

  if (!didInit.current) {
    didInit.current = true;
    setTimeout(() => generate(initialDest, initialDays, initialOrigin), 0);
  }

  async function generate(d = dest, n = days, o = origin) {
    setLoading(true);
    setSections(null);
    setError(null);

    try {
      const prompt = buildItineraryPrompt(d, n, o);
       const res = await fetch("https://ai-travel-planner-server1.onrender.com/api/generate-itinerary", {
        // const res = await fetch("http://localhost:8080/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: d, days: n, origin: o, prompt }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      const text = data.itinerary || "";
      setRawText(text);
      setSections(parseSections(text));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyText() {
    if (!rawText) return;
    navigator.clipboard?.writeText(rawText).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 2000);
    });
  }

  function quickVariant(promptFn) {
    const customPrompt = promptFn(dest, days);
    generate(dest, days, origin);
  }

  return (
    <div style={styles.plannerPage}>
      {/* Header */}
      <header style={styles.planHeader}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <div style={styles.planLogo}>
            ✈ Trip<span style={{ color: "#378add" }}>AI</span>
          </div>
        </div>
        <div style={styles.planControls}>
          <input
            style={{ ...styles.ctrlInput, width: 170 }}
            type="text"
            placeholder="Destination"
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <input
            style={{ ...styles.ctrlInput, width: 68, textAlign: "center" }}
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            title="Number of days"
          />
          <button
            style={{ ...styles.ctrlBtn, opacity: loading ? 0.45 : 1 }}
            onClick={() => generate()}
            disabled={loading}
          >
            Generate
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={styles.planBody}>

        {/* Empty */}
        {!loading && !sections && !error && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🗺️</span>
            <p>Enter a destination above and hit <strong>Generate</strong></p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <div style={styles.loadingText}>Crafting your trip from {origin} to {dest}…</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>⚠️</span>
            <p>Something went wrong.<br /><small style={{ color: "#c0392b" }}>{error}</small></p>
          </div>
        )}

        {/* Results */}
        {!loading && sections && (
          <>
            {/* Top bar */}
            <div style={styles.resultsTopBar}>
              <div>
                <div style={styles.itinDestName}>{dest}</div>
                <div style={styles.itinMeta}>{days}-day itinerary from {origin} · Generated by AI</div>
              </div>
              <button style={styles.copyBtn} onClick={copyText}>{copyLabel}</button>
            </div>

            {/* Section cards */}
            <div style={styles.sectionsGrid}>
              {/* Itinerary full width */}
              <div style={styles.fullWidth}>
                <SectionCard label="ITINERARY" lines={sections["ITINERARY"]} />
              </div>

              {/* Info cards row */}
              <div style={styles.infoGrid}>
                <SectionCard label="VISA"    lines={sections["VISA"]} />
                <SectionCard label="WEATHER" lines={sections["WEATHER"]} />
                <SectionCard label="BUDGET"  lines={sections["BUDGET"]} />
                <SectionCard label="TIPS"    lines={sections["TIPS"]} />
              </div>
            </div>

            {/* Variations */}
            <div style={styles.templatesSection}>
              <div style={styles.templatesLabel}>Variations</div>
              <div style={styles.templatesRow}>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    style={styles.tmplBtn}
                    onClick={() => quickVariant(t.prompt)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ROOT APP
───────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("hero");
  const [tripDest, setTripDest] = useState("");
  const [tripDays, setTripDays] = useState(5);
  const [tripOrigin, setTripOrigin] = useState("India");

  function handleStart(dest, days, origin) {
    setTripDest(dest);
    setTripDays(days);
    setTripOrigin(origin);
    setPage("planner");
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {page === "hero" && <HeroPage onStart={handleStart} />}
      {page === "planner" && (
        <PlannerPage
          key={tripDest + tripDays + tripOrigin}
          initialDest={tripDest}
          initialDays={tripDays}
          initialOrigin={tripOrigin}
          onBack={() => setPage("hero")}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   STYLES (unchanged)
───────────────────────────────────────── */
const styles = {
  /* Hero */
  hero: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "2rem",
    position: "relative",
    background: "linear-gradient(160deg, #0a1628 0%, #0f2847 50%, #1a3a5c 100%)",
    overflow: "hidden",
  },
  stars: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `
      radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 0%),
      radial-gradient(1px 1px at 22% 8%,  rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 38% 20%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 55% 5%,  rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 85% 10%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 5%  40%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1px 1px at 18% 50%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 48% 45%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1px 1px at 65% 38%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 12% 70%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 30% 78%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 75% 82%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1px 1px at 92% 68%, rgba(255,255,255,0.6) 0%, transparent 0%)
    `,
  },
  moon: {
    position: "absolute", top: "8%", right: "10%",
    width: 80, height: 80, borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #fff9e6, #f5d78e)",
    boxShadow: "0 0 40px rgba(245,215,142,0.3), 0 0 80px rgba(245,215,142,0.1)",
  },
  plane: {
    position: "absolute", top: "16%", left: "7%",
    fontSize: 40, opacity: 0.12, transform: "rotate(15deg)",
  },
  heroContent: {
    position: "relative", zIndex: 2, textAlign: "center",
    maxWidth: 680, width: "100%",
  },
  badge: {
    display: "inline-block", fontSize: 11, fontWeight: 500,
    letterSpacing: "1.8px", textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    padding: "5px 16px", borderRadius: 20, marginBottom: "1.5rem",
  },
  heroTitle: {
    fontSize: "clamp(2.2rem, 6vw, 3.8rem)", fontWeight: 600,
    lineHeight: 1.1, color: "#fff", marginBottom: "1rem",
  },
  heroTitleGradient: {
    background: "linear-gradient(135deg, #7eb8f7, #a78bfa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: "1.05rem", color: "rgba(255,255,255,0.45)",
    lineHeight: 1.7, marginBottom: "2.5rem",
  },
  searchCard: {
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 20, padding: "1.5rem", marginBottom: "1.5rem",
    backdropFilter: "blur(12px)",
  },
  inputRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  destInput: {
    flex: 1, minWidth: 160,
    background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 12, color: "#fff", fontSize: 15,
    padding: "13px 16px", outline: "none",
  },
  daysInput: {
    width: 80, textAlign: "center",
    background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 12, color: "#fff", fontSize: 15,
    padding: "13px 10px", outline: "none",
  },
  planBtn: {
    background: "linear-gradient(135deg, #378add, #7c5cbf)",
    border: "none", borderRadius: 12, color: "#fff",
    fontSize: 15, fontWeight: 500, padding: "13px 24px",
    cursor: "pointer", whiteSpace: "nowrap",
  },
  quickPicks: {
    display: "flex", gap: 8, flexWrap: "wrap",
    justifyContent: "center", alignItems: "center",
  },
  picksLabel: { fontSize: 12, color: "rgba(255,255,255,0.28)" },
  quickChip: {
    background: "rgba(255,255,255,0.06)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 20, padding: "6px 15px",
    fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer",
  },
  footerNote: {
    marginTop: "2.5rem", fontSize: 11,
    color: "rgba(255,255,255,0.18)", letterSpacing: "0.5px",
  },

  /* Planner */
  plannerPage: {
    display: "flex", flexDirection: "column",
    minHeight: "100vh", background: "#f4f6f9",
  },
  planHeader: {
    background: "#fff", borderBottom: "1px solid #e5e8ed",
    padding: "0.9rem 1.5rem", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "1rem",
    position: "sticky", top: 0, zIndex: 10,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  planLogo: { fontSize: 16, fontWeight: 600, color: "#1a1a2e" },
  backBtn: {
    background: "none", border: "1px solid #dde1e8",
    borderRadius: 8, padding: "7px 13px",
    fontSize: 13, color: "#5a6478", cursor: "pointer",
  },
  planControls: { display: "flex", gap: 8, alignItems: "center" },
  ctrlInput: {
    background: "#f4f6f9", border: "1px solid #dde1e8",
    borderRadius: 8, padding: "8px 13px",
    fontSize: 13, color: "#1a1a2e", outline: "none",
  },
  ctrlBtn: {
    background: "linear-gradient(135deg, #378add, #7c5cbf)",
    border: "none", borderRadius: 8, color: "#fff",
    fontSize: 13, fontWeight: 500, padding: "8px 18px", cursor: "pointer",
  },
  planBody: {
    flex: 1, padding: "2rem 1.5rem",
    maxWidth: 960, margin: "0 auto", width: "100%",
  },
  emptyState: {
    textAlign: "center", padding: "5rem 2rem", color: "#8a94a6",
  },
  emptyIcon: { fontSize: 52, display: "block", marginBottom: "1rem" },
  loadingWrap: { textAlign: "center", padding: "4rem 1.5rem" },
  spinner: {
    width: 36, height: 36, border: "2px solid #e5e8ed",
    borderTopColor: "#378add", borderRadius: "50%",
    margin: "0 auto 1rem",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { fontSize: 14, color: "#8a94a6" },

  /* Results top bar */
  resultsTopBar: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: "1rem",
    marginBottom: "1.25rem",
  },
  itinDestName: { fontSize: 20, fontWeight: 600, color: "#1a1a2e" },
  itinMeta: { fontSize: 13, color: "#8a94a6", marginTop: 3 },
  copyBtn: {
    background: "none", border: "1px solid #dde1e8",
    borderRadius: 8, padding: "7px 14px",
    fontSize: 12, color: "#5a6478", cursor: "pointer", whiteSpace: "nowrap",
  },

  /* Sections layout */
  sectionsGrid: { display: "flex", flexDirection: "column", gap: 16 },
  fullWidth: { width: "100%" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },

  /* Section card */
  sectionCard: {
    background: "#fff", border: "1px solid #e5e8ed",
    borderRadius: 14, overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  sectionCardHeader: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "12px 16px",
    borderBottom: "1px solid #f0f2f5",
    background: "#fafbfc",
  },
  sectionIcon: { fontSize: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: "1.2px",
    color: "#5a6478", textTransform: "uppercase",
  },
  sectionCardBody: {
    padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: 2,
  },

  /* Itinerary lines */
  dayHeader: {
    fontSize: 12, fontWeight: 700, letterSpacing: "0.5px",
    color: "#378add", textTransform: "uppercase",
    marginTop: 14, marginBottom: 4,
  },
  activityLine: {
    fontSize: 13.5, lineHeight: 1.7, color: "#2d3748",
    padding: "4px 0", borderBottom: "0.5px solid #f4f6f9",
  },

  /* Bullet lines (visa, weather, budget, tips) */
  bulletLine: {
    display: "flex", gap: 8,
    fontSize: 13.5, lineHeight: 1.65, color: "#2d3748",
    padding: "4px 0",
  },
  bulletDot: { color: "#378add", fontWeight: 700, flexShrink: 0 },

  /* Templates */
  templatesSection: { marginTop: "1.5rem" },
  templatesLabel: {
    fontSize: 11, color: "#8a94a6", marginBottom: 10,
    textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600,
  },
  templatesRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tmplBtn: {
    background: "#fff", border: "1px solid #dde1e8",
    borderRadius: 20, padding: "8px 16px",
    fontSize: 13, color: "#5a6478", cursor: "pointer",
  },
};