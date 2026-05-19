import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

function buildPrompt(dest, days) {
  return `Create a detailed ${days}-day travel itinerary for ${dest}.
Format exactly like this:
Day 1: [Theme]
- Morning: [activity with 1-sentence description]
- Afternoon: [activity with 1-sentence description]
- Evening: [activity with 1-sentence description]

Day 2: [Theme]
...and so on for all ${days} days.

Include a mix of iconic sights, local food experiences, and hidden gems. Keep descriptions practical and vivid.`;
}

function parseItinerary(text) {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => {
      const trimmed = line.trim();
      if (/^Day\s+\d+/i.test(trimmed)) {
        return (
          <span key={i} style={styles.dayHeader}>
            {trimmed}
          </span>
        );
      }
      return (
        <span key={i} style={styles.activityLine}>
          {trimmed}
        </span>
      );
    });
}

const QUICK_PICKS = ["Paris", "Tokyo", "Bali", "New York", "Rome", "Santorini"];
const TEMPLATES = [
  {
    label: "💕 Romantic escape",
    prompt: (d, n) =>
      `Rewrite as a romantic couples itinerary for ${d} (${n} days).`,
  },
  {
    label: "🍜 Foodie focus",
    prompt: (d, n) =>
      `Focus on food, markets, and restaurants in ${d} (${n} days).`,
  },
  {
    label: "💰 Budget version",
    prompt: (d, n) =>
      `Make it a budget-friendly ${n}-day trip to ${d} with affordable options.`,
  },
  {
    label: "🏔 Off the beaten path",
    prompt: (d, n) =>
      `Replace tourist traps with hidden gems and local spots in ${d} (${n} days).`,
  },
];

/* ─────────────────────────────────────────
   HERO PAGE
───────────────────────────────────────── */
function HeroPage({ onStart }) {
  const [dest, setDest] = useState("");
  const [days, setDays] = useState(5);

  const handleStart = (prefilled) => {
    const d = prefilled || dest;
    if (!d.trim()) return;
    onStart(d.trim(), days);
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
              onClick={() => {
                setDest(city);
                handleStart(city);
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLANNER PAGE
───────────────────────────────────────── */
function PlannerPage({ initialDest, initialDays, onBack }) {
  const [dest, setDest] = useState(initialDest);
  const [days, setDays] = useState(initialDays);
  const [itinerary, setItinerary] = useState(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy itinerary");
  const generatedRef = useRef(false);

  // Auto-generate on mount
  if (!generatedRef.current) {
    generatedRef.current = true;
    setTimeout(() => generate(initialDest, initialDays), 0);
  }

  async function callClaude(prompt, d, n) {
    setLoading(true);
    setItinerary(null);
    try {
        const res = await fetch("https://ai-travel-planner-server1.onrender.com", {
    //   const res = await fetch("http://localhost:8080/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: d, days: n, prompt }),
      });
      const data = await res.json();
      const text = data.itinerary || "Could not generate.";
      setRawText(text);
      setItinerary({ dest: d, days: n, text });
    } catch (err) {
      setItinerary({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  function generate(d = dest, n = days) {
    callClaude(buildPrompt(d, n), d, n);
  }

  function quickVariant(promptFn) {
    callClaude(promptFn(dest, days), dest, days);
  }

  function copyText() {
    if (!rawText) return;
    navigator.clipboard?.writeText(rawText).then(() => {
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy itinerary"), 2000);
    });
  }

  return (
    <div style={styles.plannerPage}>
      {/* Header */}
      <header style={styles.planHeader}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
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
        {/* Empty state */}
        {!loading && !itinerary && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🗺️</span>
            <p>
              Enter a destination above and hit <strong>Generate</strong>
              <br />
              to see your itinerary.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={styles.itineraryCard}>
            <div style={styles.itinHeader}>
              <div>
                <div style={styles.itinDestName}>{dest}</div>
                <div style={styles.itinMeta}>
                  {days}-day itinerary · Generating…
                </div>
              </div>
            </div>
            <div style={styles.loadingState}>
              <div style={styles.spinner} />
              <div style={styles.loadingText}>
                Crafting your perfect trip to {dest}…
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && itinerary?.error && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>⚠️</span>
            <p>
              Something went wrong.
              <br />
              <small style={{ color: "#c0392b" }}>{itinerary.error}</small>
            </p>
          </div>
        )}

        {/* Itinerary */}
        {!loading && itinerary && !itinerary.error && (
          <>
            <div style={styles.itineraryCard}>
              <div style={styles.itinHeader}>
                <div>
                  <div style={styles.itinDestName}>{itinerary.dest}</div>
                  <div style={styles.itinMeta}>
                    {itinerary.days}-day itinerary · Generated by AI
                  </div>
                </div>
                <button style={styles.copyBtn} onClick={copyText}>
                  {copyLabel}
                </button>
              </div>
              <div style={styles.itinBody}>
                <ReactMarkdown>{itinerary.text}</ReactMarkdown>
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

  function handleStart(dest, days) {
    setTripDest(dest);
    setTripDays(days);
    setPage("planner");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {page === "hero" && <HeroPage onStart={handleStart} />}
      {page === "planner" && (
        <PlannerPage
          key={tripDest + tripDays}
          initialDest={tripDest}
          initialDays={tripDays}
          onBack={() => setPage("hero")}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const styles = {
  /* Hero */
  hero: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    position: "relative",
    background:
      "linear-gradient(160deg, #0a1628 0%, #0f2847 50%, #1a3a5c 100%)",
    overflow: "hidden",
  },
  stars: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: `
      radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 0%),
      radial-gradient(1px 1px at 22% 8%,  rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 38% 20%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 55% 5%,  rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 85% 10%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 93% 25%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1px 1px at 5%  40%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1px 1px at 18% 50%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 48% 45%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1px 1px at 65% 38%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 80% 48%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1px 1px at 12% 70%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 30% 78%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 58% 72%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1px 1px at 75% 82%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1px 1px at 92% 68%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 42% 90%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 8%  92%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1px 1px at 88% 92%, rgba(255,255,255,0.3) 0%, transparent 0%)
    `,
  },
  moon: {
    position: "absolute",
    top: "8%",
    right: "10%",
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 35%, #fff9e6, #f5d78e)",
    boxShadow: "0 0 40px rgba(245,215,142,0.3), 0 0 80px rgba(245,215,142,0.1)",
  },
  plane: {
    position: "absolute",
    top: "16%",
    left: "7%",
    fontSize: 40,
    opacity: 0.12,
    transform: "rotate(15deg)",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    maxWidth: 680,
    width: "100%",
  },
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "1.8px",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    padding: "5px 16px",
    borderRadius: 20,
    marginBottom: "1.5rem",
  },
  heroTitle: {
    fontSize: "clamp(2.2rem, 6vw, 3.8rem)",
    fontWeight: 600,
    lineHeight: 1.1,
    color: "#fff",
    marginBottom: "1rem",
  },
  heroTitleGradient: {
    background: "linear-gradient(135deg, #7eb8f7, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.7,
    marginBottom: "2.5rem",
  },
  searchCard: {
    background: "rgba(255,255,255,0.05)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "1.5rem",
    marginBottom: "1.5rem",
    backdropFilter: "blur(12px)",
  },
  inputRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  destInput: {
    flex: 1,
    minWidth: 160,
    background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    padding: "13px 16px",
    outline: "none",
  },
  daysInput: {
    width: 80,
    textAlign: "center",
    background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    padding: "13px 10px",
    outline: "none",
  },
  planBtn: {
    background: "linear-gradient(135deg, #378add, #7c5cbf)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 500,
    padding: "13px 24px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  quickPicks: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  picksLabel: { fontSize: 12, color: "rgba(255,255,255,0.28)" },
  quickChip: {
    background: "rgba(255,255,255,0.06)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "6px 15px",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    cursor: "pointer",
  },
  footerNote: {
    marginTop: "2.5rem",
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    letterSpacing: "0.5px",
  },

  /* Planner */
  plannerPage: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "#f4f6f9",
  },
  planHeader: {
    background: "#fff",
    borderBottom: "1px solid #e5e8ed",
    padding: "0.9rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  planLogo: { fontSize: 16, fontWeight: 600, color: "#1a1a2e" },
  backBtn: {
    background: "none",
    border: "1px solid #dde1e8",
    borderRadius: 8,
    padding: "7px 13px",
    fontSize: 13,
    color: "#5a6478",
    cursor: "pointer",
  },
  planControls: { display: "flex", gap: 8, alignItems: "center" },
  ctrlInput: {
    background: "#f4f6f9",
    border: "1px solid #dde1e8",
    borderRadius: 8,
    padding: "8px 13px",
    fontSize: 13,
    color: "#1a1a2e",
    outline: "none",
  },
  ctrlBtn: {
    background: "linear-gradient(135deg, #378add, #7c5cbf)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    padding: "8px 18px",
    cursor: "pointer",
  },
  planBody: {
    flex: 1,
    padding: "2rem 1.5rem",
    maxWidth: 860,
    margin: "0 auto",
    width: "100%",
  },
  emptyState: {
    textAlign: "center",
    padding: "5rem 2rem",
    color: "#8a94a6",
  },
  emptyIcon: { fontSize: 52, display: "block", marginBottom: "1rem" },

  /* Card */
  itineraryCard: {
    background: "#fff",
    border: "1px solid #e5e8ed",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: "1.5rem",
    boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
  },
  itinHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid #f0f2f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  itinDestName: { fontSize: 18, fontWeight: 600, color: "#1a1a2e" },
  itinMeta: { fontSize: 13, color: "#8a94a6", marginTop: 3 },
  copyBtn: {
    background: "none",
    border: "1px solid #dde1e8",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 12,
    color: "#5a6478",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  itinBody: {
    padding: "1.5rem 1.75rem",
    fontSize: 14.5,
    lineHeight: 1.85,
    color: "#2d3748",
  },
  dayHeader: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.5px",
    color: "#378add",
    textTransform: "uppercase",
    marginTop: "1.25rem",
    marginBottom: "0.3rem",
  },
  activityLine: {
    padding: "5px 0",
    borderBottom: "0.5px solid #f4f6f9",
  },

  /* Loading */
  loadingState: {
    padding: "3rem 1.5rem",
    textAlign: "center",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "2px solid #e5e8ed",
    borderTopColor: "#378add",
    borderRadius: "50%",
    margin: "0 auto 1rem",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { fontSize: 14, color: "#8a94a6" },

  /* Templates */
  templatesSection: { marginTop: "0.5rem" },
  templatesLabel: {
    fontSize: 12,
    color: "#8a94a6",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    fontWeight: 500,
  },
  templatesRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tmplBtn: {
    background: "#fff",
    border: "1px solid #dde1e8",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 13,
    color: "#5a6478",
    cursor: "pointer",
  },
};
