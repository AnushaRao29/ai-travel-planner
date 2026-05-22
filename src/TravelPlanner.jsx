import { useState, useRef, useEffect } from "react";

// ─── CITY LIST ───────────────────────────────────────────────────────────────

const POPULAR_CITIES = [
  { city: "Mumbai", country: "India" }, { city: "Delhi", country: "India" },
  { city: "Bengaluru", country: "India" }, { city: "Chennai", country: "India" },
  { city: "Kolkata", country: "India" }, { city: "Hyderabad", country: "India" },
  { city: "Ahmedabad", country: "India" }, { city: "Pune", country: "India" },
  { city: "New York", country: "USA" }, { city: "Los Angeles", country: "USA" },
  { city: "Chicago", country: "USA" }, { city: "San Francisco", country: "USA" },
  { city: "Miami", country: "USA" },
  { city: "London", country: "UK" }, { city: "Manchester", country: "UK" },
  { city: "Edinburgh", country: "UK" },
  { city: "Toronto", country: "Canada" }, { city: "Vancouver", country: "Canada" },
  { city: "Sydney", country: "Australia" }, { city: "Melbourne", country: "Australia" },
  { city: "Berlin", country: "Germany" }, { city: "Munich", country: "Germany" },
  { city: "Paris", country: "France" }, { city: "Lyon", country: "France" },
  { city: "Tokyo", country: "Japan" }, { city: "Osaka", country: "Japan" },
  { city: "Kyoto", country: "Japan" },
  { city: "Singapore", country: "Singapore" },
  { city: "Dubai", country: "UAE" }, { city: "Abu Dhabi", country: "UAE" },
  { city: "Shanghai", country: "China" }, { city: "Beijing", country: "China" },
  { city: "São Paulo", country: "Brazil" }, { city: "Rio de Janeiro", country: "Brazil" },
  { city: "Cape Town", country: "South Africa" },
  { city: "Mexico City", country: "Mexico" }, { city: "Cancún", country: "Mexico" },
  { city: "Rome", country: "Italy" }, { city: "Milan", country: "Italy" },
  { city: "Florence", country: "Italy" },
  { city: "Madrid", country: "Spain" }, { city: "Barcelona", country: "Spain" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Seoul", country: "South Korea" }, { city: "Busan", country: "South Korea" },
  { city: "Auckland", country: "New Zealand" },
  { city: "Bangkok", country: "Thailand" }, { city: "Phuket", country: "Thailand" },
  { city: "Chiang Mai", country: "Thailand" },
  { city: "Bali", country: "Indonesia" }, { city: "Jakarta", country: "Indonesia" },
  { city: "Kuala Lumpur", country: "Malaysia" },
  { city: "Ho Chi Minh City", country: "Vietnam" }, { city: "Hanoi", country: "Vietnam" },
  { city: "Manila", country: "Philippines" },
  { city: "Colombo", country: "Sri Lanka" }, { city: "Kathmandu", country: "Nepal" },
  { city: "Dhaka", country: "Bangladesh" }, { city: "Karachi", country: "Pakistan" },
  { city: "Cairo", country: "Egypt" }, { city: "Istanbul", country: "Turkey" },
  { city: "Athens", country: "Greece" }, { city: "Zurich", country: "Switzerland" },
  { city: "Vienna", country: "Austria" }, { city: "Prague", country: "Czech Republic" },
  { city: "Budapest", country: "Hungary" },
  { city: "Lisbon", country: "Portugal" }, { city: "Porto", country: "Portugal" },
  { city: "Stockholm", country: "Sweden" }, { city: "Copenhagen", country: "Denmark" },
  { city: "Oslo", country: "Norway" },
];

const QUICK_PICKS = ["Paris", "Tokyo", "Bali", "New York", "Rome", "Santorini", "Dubai", "Bangkok"];

const TEMPLATES = [
  { label: "💕 Romantic escape",     fn: (d, n) => `Rewrite as a romantic couples itinerary for ${d} (${n} days).` },
  { label: "🍜 Foodie focus",        fn: (d, n) => `Focus on food, markets, and restaurants in ${d} (${n} days).` },
  { label: "💰 Budget version",      fn: (d, n) => `Make it a budget-friendly ${n}-day trip to ${d}.` },
  { label: "🏔 Off the beaten path", fn: (d, n) => `Replace tourist traps with hidden gems in ${d} (${n} days).` },
];

// Section headers as they appear in AI output (using == delimiters)
// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const SECTION_KEYS = ["ITINERARY", "VISA", "WEATHER", "BUDGET", "FLIGHTS", "TIPS", "PLACES"];

// ─── PROMPT BUILDER ───────────────────────────────────────────────────────────

function buildPrompt(dest, days, origin) {
  // Sent to backend — backend wraps this with system message and DATA_ tag instructions
  return `${dest}|${days}|${origin}`; // backend builds the real prompt
}

// ─── PARSE AI RESPONSE ────────────────────────────────────────────────────────

function parseResponse(text) {
  const clean = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");

  // Pass 1: extract ALL DATA_ tags
  // CONVERTED section tags (injected by backend with live rates) overwrite AI tags
  const data = {};
  clean.split("\n").forEach((line) => {
    const m = line.match(/^DATA_([A-Z_]+):\s*(.+)$/);
    if (m) data[m[1]] = m[2].trim();
  });

  // Pass 2: parse display sections — skip CONVERTED (internal use only)
  const SKIP = new Set(["CONVERTED"]);
  const sections = {};
  let current = null, buf = [];

  clean.split("\n").forEach((line) => {
    const trimmed = line.trim();
    const h = trimmed.match(/^==([A-Z]+)==$/);
    if (h) {
      if (current && !SKIP.has(current)) sections[current] = buf;
      current = h[1]; buf = []; return;
    }
    const p = SECTION_KEYS.find((k) => trimmed.toUpperCase() === k);
    if (p) {
      if (current && !SKIP.has(current)) sections[current] = buf;
      current = p; buf = []; return;
    }
    if (current && !SKIP.has(current) && trimmed && !trimmed.match(/^DATA_[A-Z_]+:/)) {
      buf.push(trimmed);
    }
  });
  if (current && !SKIP.has(current)) sections[current] = buf;

  return { sections, data };
}


// ─── DATA HELPERS ─────────────────────────────────────────────────────────────

function getTag(data, key, fallback = "") {
  return data[key] || fallback;
}

function getTagInt(data, key, fallback = 0) {
  const v = data[key];
  if (!v) return fallback;
  // Extract first integer — strips commas/symbols but keeps the number
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? fallback : n;
}

// Separate helper for FX rate — must use parseFloat to preserve decimals like 0.79 (GBP), 0.92 (EUR)
function getFXRate(data) {
  const v = data["FX_RATE"];
  if (!v) return 1;
  const f = parseFloat(v);
  return isNaN(f) || f <= 0 ? 1 : f;
}

function fmtMoney(amount, currency) {
  if (!amount) return "—";
  return `${currency} ${Number(amount).toLocaleString()}`;
}

// Parse "50000-80000" or "1200-1900" price range strings into [lo, hi]
// Splits on dash/en-dash, takes only the leading number from each part
function parseRange(str = "") {
  const parts = str
    .split(/\s*[-–]\s*/)
    .map((s) => {
      const m = s.match(/^[\d,]+/);
      return m ? parseInt(m[0].replace(/,/g, ""), 10) : NaN;
    })
    .filter((n) => !isNaN(n) && n > 0);
  if (parts.length >= 2) return [parts[0], parts[1]];
  if (parts.length === 1) return [parts[0], parts[0]];
  return [0, 0];
}

function extractPlaces(lines = []) {
  return lines
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter((l) => l.length > 3 && l.includes(","));
}

// Current season based on month
function getCurrentSeason() {
  const m = new Date().getMonth(); // 0-11
  if ([11, 0, 5, 6].includes(m)) return "peak";
  if ([1, 7].includes(m)) return "offpeak";
  return "shoulder";
}

const SEASON_LABEL = {
  peak: "Peak season",
  shoulder: "Shoulder season",
  offpeak: "Off-peak season",
};

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────

function TravelMap({ places, destName }) {
  const isMobile = useIsMobile();
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () => new Promise((resolve) => {
      if (window.L) { resolve(); return; }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = resolve;
      document.head.appendChild(s);
    });

    const geocode = async (query) => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
          { headers: { "User-Agent": "TravelPlannerApp/1.0" } }
        );
        const d = await r.json();
        if (d?.[0]) return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: query };
      } catch (_) {}
      return null;
    };

    const init = async () => {
      await loadLeaflet();
      if (cancelled || !mapRef.current) return;

      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

      const map = window.L.map(mapRef.current, { scrollWheelZoom: false });
      instanceRef.current = map;
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      const toGeocode = places.length > 0 ? places.slice(0, 10) : [destName];
      const coords = [];

      for (const place of toGeocode) {
        if (cancelled) return;
        const c = await geocode(place);
        if (c) coords.push(c);
        await new Promise((r) => setTimeout(r, 400));
      }

      if (coords.length === 0) {
        const fb = await geocode(destName);
        if (fb) coords.push(fb);
      }

      if (cancelled || coords.length === 0) { setStatus("error"); return; }

      coords.forEach((c, i) => {
        const icon = window.L.divIcon({
          html: `<div style="background:linear-gradient(135deg,#378add,#7c5cbf);color:#fff;
            width:28px;height:28px;border-radius:50%;display:flex;align-items:center;
            justify-content:center;font-size:12px;font-weight:600;border:2px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);font-family:sans-serif">${i + 1}</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14],
        });
        window.L.marker([c.lat, c.lon], { icon })
          .addTo(map)
          .bindPopup(`<b style="font-size:13px;font-family:sans-serif">${c.name}</b>`);
      });

      const bounds = coords.map((c) => [c.lat, c.lon]);
      if (bounds.length === 1) map.setView(bounds[0], 12);
      else map.fitBounds(bounds, { padding: [40, 40] });
      setStatus("ready");
    };

    init();
    return () => { cancelled = true; };
  }, [places.join("|"), destName]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span>🗺️</span><span style={styles.cardLabel}>MAP — PLACES IN YOUR ITINERARY</span>
      </div>
      <div style={{ position: "relative", height: isMobile ? 280 : 400, overflow: "hidden" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {status === "loading" && (
          <div style={styles.mapOverlay}>
            <div style={styles.spinner} />
            <p style={{ fontSize: 13, color: "#8a94a6", margin: "8px 0 0" }}>Pinning places on map…</p>
          </div>
        )}
        {status === "error" && (
          <div style={styles.mapOverlay}>
            <span style={{ fontSize: 32 }}>🗺️</span>
            <p style={{ fontSize: 13, color: "#8a94a6", marginTop: 8 }}>Map unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VISA CARD ────────────────────────────────────────────────────────────────

function VisaCard({ lines, data, dest }) {
  // Clean URL: strip trailing dots/spaces/brackets/notes that LLaMA sometimes appends
  const rawUrl = getTag(data, "VISA_URL");
  const cleanedUrl = rawUrl
    .replace(/^\[/, "").replace(/\]$/, "")   // strip brackets
    .split(" ")[0]                             // drop anything after first space
    .replace(/[.,;)]+$/, "")                  // strip trailing punctuation
    .trim();
  const url = cleanedUrl && !cleanedUrl.startsWith("http") && cleanedUrl.includes(".")
    ? "https://" + cleanedUrl                 // prepend https:// if missing
    : cleanedUrl;

  const free = getTag(data, "VISA_FREE");
  const displayLines = lines.filter((l) => !l.match(/^DATA_/));

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span>🛂</span><span style={styles.cardLabel}>VISA</span>
        {free === "YES" && <span style={styles.badgeGreen}>Visa Free ✓</span>}
        {free === "NO"  && <span style={styles.badgeRed}>Visa Required</span>}
      </div>
      <div style={styles.cardBody}>
        {displayLines.map((line, i) => (
          <div key={i} style={styles.bulletLine}>
            <span style={styles.dot}>·</span>
            <span>{line.replace(/^[-•]\s*/, "")}</span>
          </div>
        ))}
        {url && url.startsWith("http") ? (
          <a href={url} target="_blank" rel="noopener noreferrer" style={styles.linkBtn}>
            🔗 Official Visa Portal ↗
          </a>
        ) : (
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(dest + " official government visa application")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ ...styles.linkBtn, background: "#fafbfc", color: "#5a6478", borderColor: "#dde1e8" }}
          >
            🔍 Search official visa portal ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ─── BUDGET CARD ──────────────────────────────────────────────────────────────

function BudgetCard({ lines, data, days }) {
  const isMobile = useIsMobile();
  const [tier, setTier] = useState("mid");

  const currency = getTag(data, "CURRENCY", "USD");
  const budgetD  = getTagInt(data, "BUDGET_BACKPACKER");
  const midD     = getTagInt(data, "BUDGET_MID");
  const luxuryD  = getTagInt(data, "BUDGET_LUXURY");
  const fxRate   = getFXRate(data);
  const fxSource = getTag(data, "FX_SOURCE", "ai");

  const flightShoulder = getTag(data, "FLIGHT_PRICE_SHOULDER");
  const [flo, fhi] = parseRange(flightShoulder);
  const flightMid  = flo > 0 ? Math.round((flo + fhi) / 2) : 0;
  const flightPeak = (() => { const [a,b] = parseRange(getTag(data,"FLIGHT_PRICE_PEAK")); return a>0?Math.round((a+b)/2):0; })();
  const flightOff  = (() => { const [a,b] = parseRange(getTag(data,"FLIGHT_PRICE_OFFPEAK")); return a>0?Math.round((a+b)/2):0; })();

  const tierMap = {
    budget: { label: "🎒 Backpacker", daily: budgetD, color: "#27ae60" },
    mid:    { label: "🏨 Mid-range",  daily: midD,    color: "#378add" },
    luxury: { label: "✨ Luxury",     daily: luxuryD, color: "#7c5cbf" },
  };
  const active    = tierMap[tier];
  const stayTotal = (active.daily || 0) * days;
  const grandTotal = flightMid > 0 ? stayTotal + flightMid : 0;

  const displayLines = lines.filter((l) => !l.match(/^DATA_/));
  const hasBudget = budgetD > 0 || midD > 0;

  return (
    <div style={styles.card}>
      <div style={{ ...styles.cardHeader, flexWrap: "wrap", gap: 6 }}>
        <span>💰</span>
        <span style={styles.cardLabel}>BUDGET — PER PERSON</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: "#8a94a6" }}>1 USD = {fxRate} {currency}</span>
          {fxSource === "live"
            ? <span style={{ fontSize: 10, background: "#e8f8f0", color: "#27ae60", border: "1px solid #a7f3d0", borderRadius: 4, padding: "2px 7px", fontWeight: 600, whiteSpace: "nowrap" }}>✓ Live</span>
            : <span style={{ fontSize: 10, background: "#fff8e8", color: "#b45309", border: "1px solid #fde68a", borderRadius: 4, padding: "2px 7px", fontWeight: 600, whiteSpace: "nowrap" }}>⚠ Approx</span>
          }
        </div>
      </div>

      <div style={{ padding: "20px 20px 16px" }}>
        {hasBudget ? (
          <>
            {/* Tier selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {Object.entries(tierMap).map(([key, t]) => t.daily > 0 && (
                <button key={key}
                  style={{
                    padding: "8px 20px", borderRadius: 24, fontSize: 13, fontWeight: 500,
                    border: "1.5px solid", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                    background: tier === key ? t.color : "#fff",
                    color: tier === key ? "#fff" : t.color,
                    borderColor: t.color,
                  }}
                  onClick={() => setTier(key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Two-column grid: left = cost breakdown, right = totals */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* LEFT: per-day breakdown */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8a94a6", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
                  Daily breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "🎒 Backpacker", val: budgetD, color: "#27ae60" },
                    { label: "🏨 Mid-range",  val: midD,    color: "#378add" },
                    { label: "✨ Luxury",     val: luxuryD, color: "#7c5cbf" },
                  ].map(t => t.val > 0 && (
                    <div key={t.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 14px", borderRadius: 8, background: tier === Object.keys(tierMap).find(k=>tierMap[k].daily===t.val) ? "#f0f6fd" : "#fafbfc",
                      border: `1px solid ${tier === Object.keys(tierMap).find(k=>tierMap[k].daily===t.val) ? "#dce8f7" : "#f0f2f5"}`,
                      borderLeft: `3px solid ${t.color}`,
                    }}>
                      <span style={{ fontSize: 13, color: "#2d3748" }}>{t.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.color }}>{fmtMoney(t.val, currency)}/day</span>
                    </div>
                  ))}
                </div>

                {displayLines.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8a94a6", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                      Local cost details
                    </div>
                    {displayLines.slice(0, 6).map((line, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#2d3748", padding: "3px 0", lineHeight: 1.6 }}>
                        <span style={{ color: "#378add", fontWeight: 700, flexShrink: 0 }}>·</span>
                        <span>{line.replace(/^[-•]\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: trip totals */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#8a94a6", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
                  Trip totals — {days} days
                </div>

                {/* Stay total */}
                <div style={{ background: "#fafbfc", border: `1.5px solid ${active.color}30`, borderLeft: `3px solid ${active.color}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#8a94a6", marginBottom: 4 }}>Stay ({active.label})</div>
                  <div style={{ fontSize: 11, color: "#8a94a6", marginBottom: 6 }}>{fmtMoney(active.daily, currency)}/day × {days} days</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: active.color }}>{fmtMoney(stayTotal, currency)}</div>
                </div>

                {/* Flight estimate */}
                {flightMid > 0 ? (
                  <div style={{ background: "#fafbfc", border: "1.5px solid #f39c1230", borderLeft: "3px solid #f39c12", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#8a94a6", marginBottom: 4 }}>Flights (roundtrip)</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      {flightOff > 0 && <span style={{ fontSize: 10, background: "#e8f8f0", color: "#27ae60", borderRadius: 4, padding: "1px 6px" }}>Off-peak {fmtMoney(flightOff, currency)}</span>}
                      {flightMid > 0 && <span style={{ fontSize: 10, background: "#e8f2ff", color: "#378add", borderRadius: 4, padding: "1px 6px" }}>Shoulder {fmtMoney(flightMid, currency)}</span>}
                      {flightPeak > 0 && <span style={{ fontSize: 10, background: "#fdf0f0", color: "#e74c3c", borderRadius: 4, padding: "1px 6px" }}>Peak {fmtMoney(flightPeak, currency)}</span>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#f39c12" }}>{fmtMoney(flightMid, currency)}</div>
                  </div>
                ) : (
                  <div style={{ background: "#fafbfc", border: "1px solid #f0f2f5", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 12, color: "#8a94a6" }}>
                    ✈️ See flights section for flight cost
                  </div>
                )}

                {/* Grand total */}
                <div style={{
                  background: "linear-gradient(135deg, #378add15, #7c5cbf15)",
                  border: "1.5px solid #378add40", borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#378add", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {grandTotal > 0 ? "Grand total" : "Stay total"}
                    </div>
                    <div style={{ fontSize: 11, color: "#8a94a6", marginTop: 2 }}>
                      {grandTotal > 0 ? "Stay + flights · per person" : "Excl. flights · per person"}
                    </div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#378add" }}>
                    {fmtMoney(grandTotal > 0 ? grandTotal : stayTotal, currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Extra tip lines if more than 6 */}
            {displayLines.length > 6 && (
              <>
                <div style={styles.divider} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                  {displayLines.slice(6).map((line, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 13, color: "#2d3748", padding: "2px 0" }}>
                      <span style={{ color: "#378add", fontWeight: 700, flexShrink: 0 }}>·</span>
                      <span>{line.replace(/^[-•]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: "#8a94a6", padding: "1rem 0" }}>Budget data not available.</div>
        )}
      </div>
    </div>
  );
}

// ─── FLIGHTS CARD ─────────────────────────────────────────────────────────────

function FlightsCard({ lines, data, origin, dest }) {
  const isMobile = useIsMobile();
  const currency      = getTag(data, "CURRENCY", "USD");
  const airlines      = getTag(data, "FLIGHT_AIRLINES");
  const fromAirport   = getTag(data, "FLIGHT_FROM_AIRPORT");
  const toAirport     = getTag(data, "FLIGHT_TO_AIRPORT");
  const duration      = getTag(data, "FLIGHT_DURATION");
  const peakRange     = getTag(data, "FLIGHT_PRICE_PEAK");
  const shoulderRange = getTag(data, "FLIGHT_PRICE_SHOULDER");
  const offpeakRange  = getTag(data, "FLIGHT_PRICE_OFFPEAK");
  const peakMonths    = getTag(data, "FLIGHT_PEAK_MONTHS");
  const shoulderMonths= getTag(data, "FLIGHT_SHOULDER_MONTHS");
  const offpeakMonths = getTag(data, "FLIGHT_OFFPEAK_MONTHS");

  const currentSeason = getCurrentSeason();

  const seasons = [
    { key: "peak",     label: "Peak",     range: peakRange,     months: peakMonths,     color: "#e74c3c" },
    { key: "shoulder", label: "Shoulder", range: shoulderRange, months: shoulderMonths, color: "#f39c12" },
    { key: "offpeak",  label: "Off-peak", range: offpeakRange,  months: offpeakMonths,  color: "#27ae60" },
  ];

  const displayLines = lines.filter((l) => !l.match(/^DATA_/));

  const noData = !airlines && !fromAirport && !peakRange;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span>✈️</span><span style={styles.cardLabel}>FLIGHTS — ROUNDTRIP ESTIMATE</span>
      </div>
      <div style={styles.cardBody}>
        {noData ? (
          <p style={{ fontSize: 13, color: "#8a94a6" }}>Flight data not available for this route.</p>
        ) : (
          <>
            {/* Route */}
            {(fromAirport || toAirport) && (
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", padding: "10px 0", marginBottom: 4, gap: isMobile ? 2 : 0 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{fromAirport || origin}</div>
                <div style={{ color: "#378add", fontSize: 13, padding: isMobile ? "2px 0" : "0 8px", transform: isMobile ? "none" : "none" }}>{"→ ✈ →"}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{toAirport || dest}</div>
              </div>
            )}
            {duration && (
              <div style={{ fontSize: 12, color: "#8a94a6", marginBottom: 12 }}>
                ~{duration}
              </div>
            )}

            {/* Airlines */}
            {airlines && (
              <div style={{ marginBottom: 12 }}>
                <div style={styles.miniLabel}>Recommended airlines</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {airlines.split(",").map((a) => (
                    <span key={a.trim()} style={styles.chip}>{a.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.divider} />

            {/* Seasonal prices */}
            <div style={styles.miniLabel}>Roundtrip price per person</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, marginBottom: 8 }}>
              {seasons.map(({ key, label, range, months, color }) => {
                const isCurrent = key === currentSeason;
                const [lo, hi] = parseRange(range);
                return (
                  <div key={key} style={{
                    background: isCurrent ? "#f0f6fd" : "#fafbfc",
                    border: isCurrent ? "1px solid #dce8f7" : "1px solid #f0f2f5",
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 8, padding: "8px 10px",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? 3 : 0,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? "#378add" : "#2d3748", display: "flex", alignItems: "center", gap: 6 }}>
                        {label}
                        {isCurrent && <span style={styles.nowBadge}>Now</span>}
                      </div>
                      {months && <div style={{ fontSize: 11, color: "#8a94a6", marginTop: 2 }}>{months}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? "#378add" : "#1a1a2e" }}>
                      {lo > 0 ? `${currency} ${lo.toLocaleString()} – ${hi.toLocaleString()}` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI note */}
            {displayLines.length > 0 && (
              <>
                <div style={styles.divider} />
                {displayLines.map((l, i) => (
                  <div key={i} style={styles.bulletLine}>
                    <span style={styles.dot}>·</span>
                    <span>{l.replace(/^[-•]\s*/, "")}</span>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        <div style={styles.divider} />
        <div style={{ fontSize: 11, color: "#8a94a6", marginBottom: 8 }}>
          Prices are AI estimates — always verify on booking sites before purchasing.
        </div>

        {/* Booking links */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "🔍 Google Flights", url: `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(dest)}` },
            { label: "✈ Skyscanner",      url: `https://www.skyscanner.com/transport/flights/${encodeURIComponent(origin)}/${encodeURIComponent(dest)}/` },
            { label: "🇮🇳 MakeMyTrip",   url: "https://www.makemytrip.com/flights/" },
          ].map((lk) => (
            <a key={lk.label} href={lk.url} target="_blank" rel="noopener noreferrer" style={styles.linkSmall}>
              {lk.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GENERIC SECTION CARD ─────────────────────────────────────────────────────

function SectionCard({ icon, label, lines }) {
  if (!lines || lines.length === 0) return null;
  const isItinerary = label === "ITINERARY";
  const displayLines = lines.filter((l) => !l.match(/^DATA_/));

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span>{icon}</span><span style={styles.cardLabel}>{label}</span>
      </div>
      <div style={styles.cardBody}>
        {isItinerary
          ? displayLines.map((line, i) => {
              if (/^Day\s+\d+/i.test(line)) return <div key={i} style={styles.dayHeader}>{line}</div>;
              return <div key={i} style={styles.activityLine}>{line}</div>;
            })
          : displayLines.map((line, i) => (
              <div key={i} style={styles.bulletLine}>
                <span style={styles.dot}>·</span>
                <span>{line.replace(/^[-•]\s*/, "")}</span>
              </div>
            ))}
      </div>
    </div>
  );
}

// ─── CITY DROPDOWN ────────────────────────────────────────────────────────────

function CityDropdown({ value, onChange, glassStyle }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = POPULAR_CITIES.filter(({ city, country }) =>
    !search ||
    city.toLowerCase().includes(search.toLowerCase()) ||
    country.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach(({ city, country }) => {
    if (!grouped[country]) grouped[country] = [];
    grouped[country].push(city);
  });

  return (
    <div ref={wrapRef} style={{ position: "relative", marginBottom: 10 }}>
      <button
        style={{ width: "100%", ...styles.glassInput, cursor: "pointer", textAlign: "left", ...(glassStyle || {}) }}
        onClick={() => setOpen(!open)}
      >
        ✈ From: {value || "Select your city"}
      </button>
      {open && (
        <div style={styles.dropdownMenu}>
          <input autoFocus type="text" placeholder="Search city or country…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={styles.dropdownSearch} />
          <div style={styles.dropdownList}>
            {Object.entries(grouped).map(([country, cities]) => (
              <div key={country}>
                <div style={styles.dropdownGroup}>{country}</div>
                {cities.map((city) => (
                  <div key={city}
                    style={{ ...styles.dropdownItem, background: value === `${city}, ${country}` ? "#e8f0ff" : "#fff" }}
                    onClick={() => { onChange(`${city}, ${country}`); setOpen(false); setSearch(""); }}>
                    {city}
                  </div>
                ))}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div style={{ padding: 12, fontSize: 13, color: "#8a94a6" }}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HERO PAGE ────────────────────────────────────────────────────────────────

function HeroPage({ onStart }) {
  const isMobile = useIsMobile();
  const [dest, setDest] = useState("");
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState("Bengaluru, India");

  const go = (prefilled) => {
    const d = prefilled || dest;
    if (!d.trim()) return;
    onStart(d.trim(), days, origin);
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
          <span style={styles.heroGradient}>planned in seconds</span>
        </h1>
        <p style={styles.heroSub}>
          Tell us where you're from and where you're headed.
          <br />We'll craft a beautiful day-by-day itinerary with real costs.
        </p>
        <div style={styles.searchCard}>
          <CityDropdown value={origin} onChange={setOrigin} />
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            <input style={{ ...styles.glassInput, minWidth: 0, width: "100%" }} type="text"
              placeholder="Where to? e.g. Paris, Bali, Tokyo…"
              value={dest} onChange={(e) => setDest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()} />
            <div style={{ display: "flex", gap: 10 }}>
              <input style={{ ...styles.glassInput, width: isMobile ? "100%" : 80, flex: isMobile ? 1 : "none", textAlign: "center" }}
                type="number" min={1} max={30} value={days}
                onChange={(e) => setDays(Number(e.target.value))} />
              <button style={{ ...styles.planBtn, flex: isMobile ? 1 : "none" }} onClick={() => go()}>Plan →</button>
            </div>
          </div>
        </div>
        <div style={styles.quickPicks}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Try:</span>
          {QUICK_PICKS.map((city) => (
            <button key={city} style={styles.quickChip}
              onClick={() => { setDest(city); go(city); }}>{city}</button>
          ))}
        </div>
        <p style={{ marginTop: "2.5rem", fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.5px" }}>
          Powered by Groq + LLaMA 3.3
        </p>
      </div>
    </div>
  );
}

// ─── PLANNER PAGE ─────────────────────────────────────────────────────────────

function PlannerPage({ initialDest, initialDays, initialOrigin, onBack }) {
  const isMobile = useIsMobile();
  const [dest, setDest]       = useState(initialDest);
  const [days, setDays]       = useState(initialDays);
  const [origin]              = useState(initialOrigin);
  const [parsed, setParsed]   = useState(null); // { sections, data }
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [copyLabel, setCopy]  = useState("Copy");
  const didInit = useRef(false);

  if (!didInit.current) {
    didInit.current = true;
    setTimeout(() => generate(initialDest, initialDays, initialOrigin), 0);
  }

  async function generate(d = dest, n = days, o = origin) {
    setLoading(true);
    setParsed(null);
    setError(null);
    try {
      const res = await fetch("https://ai-travel-planner-server1.onrender.com/api/generate-itinerary", {
        // const res = await fetch("http://localhost:8080/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: d, days: n, origin: o }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const text = json.itinerary || "";
      setRawText(text);
      setParsed(parseResponse(text));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const { sections = {}, data = {} } = parsed || {};
  const mapPlaces = extractPlaces(sections["PLACES"] || []);

  return (
    <div style={styles.plannerPage}>
      <header style={{ ...styles.planHeader, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={styles.backBtn} onClick={onBack}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a2e" }}>
            ✈ Trip<span style={{ color: "#378add" }}>AI</span>
          </div>
        </div>
        {/* Desktop: inputs inline in header */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input style={{ ...styles.ctrlInput, width: 170 }} type="text" placeholder="Destination"
              value={dest} onChange={(e) => setDest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()} />
            <input style={{ ...styles.ctrlInput, width: 68, textAlign: "center" }}
              type="number" min={1} max={30} value={days}
              onChange={(e) => setDays(Number(e.target.value))} />
            <button style={{ ...styles.ctrlBtn, opacity: loading ? 0.45 : 1 }}
              onClick={() => generate()} disabled={loading}>Generate</button>
          </div>
        )}
        {/* Mobile: compact full-width row below logo */}
        {isMobile && (
          <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 8 }}>
            <input style={{ ...styles.ctrlInput, flex: 1, minWidth: 0 }} type="text" placeholder="Destination"
              value={dest} onChange={(e) => setDest(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()} />
            <input style={{ ...styles.ctrlInput, width: 52, textAlign: "center", flexShrink: 0 }}
              type="number" min={1} max={30} value={days}
              onChange={(e) => setDays(Number(e.target.value))} />
            <button style={{ ...styles.ctrlBtn, flexShrink: 0, opacity: loading ? 0.45 : 1 }}
              onClick={() => generate()} disabled={loading}>Go</button>
          </div>
        )}
      </header>

      <div style={styles.planBody}>
        {!loading && !parsed && !error && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 52, display: "block", marginBottom: "1rem" }}>🗺️</span>
            <p>Enter a destination and hit <strong>Generate</strong></p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
            <div style={styles.spinner} />
            <div style={{ fontSize: 14, color: "#8a94a6" }}>
              Asking Groq AI to plan your trip from {origin} to {dest}…
            </div>
          </div>
        )}

        {!loading && error && (
          <div style={styles.emptyState}>
            <span style={{ fontSize: 52, display: "block", marginBottom: "1rem" }}>⚠️</span>
            <p>Something went wrong.<br /><small style={{ color: "#c0392b" }}>{error}</small></p>
          </div>
        )}

        {!loading && parsed && (
          <>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a2e" }}>{dest}</div>
                <div style={{ fontSize: 13, color: "#8a94a6", marginTop: 3 }}>
                  {days}-day itinerary · from {origin} · Powered by Groq AI
                </div>
              </div>
              <button style={styles.copyBtn} onClick={() => {
                navigator.clipboard?.writeText(rawText).then(() => {
                  setCopy("Copied!"); setTimeout(() => setCopy("Copy"), 2000);
                });
              }}>{copyLabel}</button>
            </div>

            <div style={styles.sectionsGrid}>
              {/* Itinerary full width */}
              {sections["ITINERARY"] && (
                <div style={styles.fullWidth}>
                  <SectionCard icon="🗓" label="ITINERARY" lines={sections["ITINERARY"]} />
                </div>
              )}

              {/* Map full width */}
              <div style={styles.fullWidth}>
                <TravelMap places={mapPlaces} destName={dest} />
              </div>

              {/* Info grid — Visa, Weather, Tips (3 equal columns) */}
              <div style={styles.infoGrid}>
                {sections["VISA"] && <VisaCard lines={sections["VISA"]} data={data} dest={dest} />}
                {sections["WEATHER"] && <SectionCard icon="🌤" label="WEATHER" lines={sections["WEATHER"]} />}
                {sections["TIPS"] && <SectionCard icon="💡" label="TIPS" lines={sections["TIPS"]} />}
              </div>

              {/* Budget — full width, spacious layout */}
              <div style={styles.fullWidth}>
                <BudgetCard lines={sections["BUDGET"] || []} data={data} days={days} />
              </div>

              {/* Flights full width */}
              <div style={styles.fullWidth}>
                <FlightsCard lines={sections["FLIGHTS"] || []} data={data} origin={origin} dest={dest} />
              </div>
            </div>

            {/* Variations */}
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ fontSize: 11, color: "#8a94a6", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>
                Variations
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TEMPLATES.map((t) => (
                  <button key={t.label} style={styles.tmplBtn}
                    onClick={() => generate(dest + " — " + t.fn(dest, days), days, origin)}>
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]         = useState("hero");
  const [tripDest, setTripDest] = useState("");
  const [tripDays, setTripDays] = useState(5);
  const [tripOrigin, setTripOrigin] = useState("Bengaluru, India");

  function handleStart(dest, days, origin) {
    setTripDest(dest); setTripDays(days); setTripOrigin(origin);
    setPage("planner");
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {page === "hero" && <HeroPage onStart={handleStart} />}
      {page === "planner" && (
        <PlannerPage
          key={tripDest + tripDays + tripOrigin}
          initialDest={tripDest} initialDays={tripDays}
          initialOrigin={tripOrigin} onBack={() => setPage("hero")}
        />
      )}
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = {
  hero: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", padding: "1.5rem 1rem",
    position: "relative",
    background: "linear-gradient(160deg, #0a1628 0%, #0f2847 50%, #1a3a5c 100%)",
    overflow: "hidden",
  },
  stars: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: `radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.8) 0%, transparent 0%),
      radial-gradient(1px 1px at 22% 8%, rgba(255,255,255,0.5) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 38% 20%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 55% 5%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.4) 0%, transparent 0%),
      radial-gradient(1.5px 1.5px at 85% 10%, rgba(255,255,255,0.7) 0%, transparent 0%),
      radial-gradient(1px 1px at 18% 50%, rgba(255,255,255,0.6) 0%, transparent 0%),
      radial-gradient(1px 1px at 75% 82%, rgba(255,255,255,0.5) 0%, transparent 0%)`,
  },
  moon: {
    position: "absolute", top: "8%", right: "10%", width: 80, height: 80,
    borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff9e6, #f5d78e)",
  },
  plane: { position: "absolute", top: "16%", left: "7%", fontSize: 40, opacity: 0.12, transform: "rotate(15deg)" },
  heroContent: { position: "relative", zIndex: 2, textAlign: "center", maxWidth: 680, width: "100%" },
  badge: {
    display: "inline-block", fontSize: 11, fontWeight: 500, letterSpacing: "1.8px",
    textTransform: "uppercase", color: "rgba(255,255,255,0.45)",
    border: "0.5px solid rgba(255,255,255,0.15)", padding: "5px 16px",
    borderRadius: 20, marginBottom: "1.5rem",
  },
  heroTitle: { fontSize: "clamp(2.2rem,6vw,3.8rem)", fontWeight: 600, lineHeight: 1.1, color: "#fff", marginBottom: "1rem" },
  heroGradient: {
    background: "linear-gradient(135deg,#7eb8f7,#a78bfa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  heroSub: { fontSize: "1.05rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: "2.5rem" },
  searchCard: {
    background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 20, padding: "1.5rem", marginBottom: "1.5rem", backdropFilter: "blur(12px)",
  },
  inputRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  glassInput: {
    flex: 1, minWidth: 160, background: "rgba(255,255,255,0.08)",
    border: "0.5px solid rgba(255,255,255,0.15)", borderRadius: 12,
    color: "#fff", fontSize: 15, padding: "13px 16px", outline: "none",
    fontFamily: "inherit",
  },
  planBtn: {
    background: "linear-gradient(135deg,#378add,#7c5cbf)", border: "none",
    borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 500,
    padding: "13px 24px", cursor: "pointer", whiteSpace: "nowrap",
  },
  quickPicks: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", alignItems: "center" },
  quickChip: {
    background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 20, padding: "6px 15px", fontSize: 13,
    color: "rgba(255,255,255,0.5)", cursor: "pointer",
  },
  dropdownMenu: {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
    background: "#fff", border: "1px solid #dde1e8", borderRadius: 8,
    boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden",
  },
  dropdownSearch: {
    width: "100%", padding: "8px 12px", border: "none",
    borderBottom: "1px solid #e5e8ed", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#1a1a2e",
  },
  dropdownList: { maxHeight: 240, overflowY: "auto" },
  dropdownGroup: {
    padding: "4px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "1px",
    color: "#8a94a6", textTransform: "uppercase", background: "#fafbfc", borderBottom: "0.5px solid #e5e8ed",
  },
  dropdownItem: { padding: "8px 12px", fontSize: 13, cursor: "pointer", color: "#1a1a2e", borderBottom: "0.5px solid #f0f2f5" },
  plannerPage: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f6f9" },
  planHeader: {
    background: "#fff", borderBottom: "1px solid #e5e8ed", padding: "0.9rem 1.5rem",
    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
    position: "sticky", top: 0, zIndex: 10,
  },
  backBtn: {
    background: "none", border: "1px solid #dde1e8", borderRadius: 8,
    padding: "7px 13px", fontSize: 13, color: "#5a6478", cursor: "pointer",
  },
  ctrlInput: {
    background: "#f4f6f9", border: "1px solid #dde1e8", borderRadius: 8,
    padding: "8px 13px", fontSize: 13, color: "#1a1a2e", outline: "none",
  },
  ctrlBtn: {
    background: "linear-gradient(135deg,#378add,#7c5cbf)", border: "none",
    borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 500, padding: "8px 18px", cursor: "pointer",
  },
  planBody: { flex: 1, padding: "2rem 1rem", maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box" },
  emptyState: { textAlign: "center", padding: "5rem 2rem", color: "#8a94a6" },
  spinner: {
    width: 36, height: 36, border: "2px solid #e5e8ed", borderTopColor: "#378add",
    borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite",
  },
  copyBtn: {
    background: "none", border: "1px solid #dde1e8", borderRadius: 8,
    padding: "7px 14px", fontSize: 12, color: "#5a6478", cursor: "pointer", whiteSpace: "nowrap",
  },
  sectionsGrid: { display: "flex", flexDirection: "column", gap: 16 },
  fullWidth: { width: "100%" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
  card: {
    background: "#fff", border: "1px solid #e5e8ed", borderRadius: 14,
    overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
    borderBottom: "1px solid #f0f2f5", background: "#fafbfc",
  },
  cardLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", color: "#5a6478", textTransform: "uppercase" },
  cardBody: { padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 },
  dayHeader: {
    fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", color: "#378add",
    textTransform: "uppercase", marginTop: 14, marginBottom: 4,
  },
  activityLine: { fontSize: 13.5, lineHeight: 1.7, color: "#2d3748", padding: "4px 0", borderBottom: "0.5px solid #f4f6f9" },
  bulletLine: { display: "flex", gap: 8, fontSize: 13.5, lineHeight: 1.65, color: "#2d3748", padding: "4px 0" },
  dot: { color: "#378add", fontWeight: 700, flexShrink: 0 },
  divider: { height: 1, background: "#f0f2f5", margin: "8px 0" },
  miniLabel: { fontSize: 11, color: "#8a94a6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px" },
  tabs: { display: "flex", gap: 6, marginBottom: 12 },
  tab: {
    fontSize: 12, padding: "5px 14px", borderRadius: 20, border: "1px solid #e5e8ed",
    background: "none", cursor: "pointer", color: "#5a6478", fontFamily: "inherit",
  },
  tabActive: { background: "#378add", color: "#fff", borderColor: "#378add" },
  tierRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "#fafbfc", borderRadius: 8,
  },
  summaryRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "#fafbfc", borderRadius: 8,
  },
  linkBtn: {
    display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10,
    fontSize: 12.5, color: "#378add", textDecoration: "none",
    border: "1px solid #dce8f7", borderRadius: 8, padding: "7px 13px",
    background: "#f0f6fd", fontWeight: 500,
  },
  linkSmall: {
    fontSize: 12, padding: "5px 12px", borderRadius: 8,
    border: "1px solid #e5e8ed", color: "#5a6478", textDecoration: "none", background: "#fafbfc",
  },
  badgeGreen: {
    marginLeft: "auto", fontSize: 11, padding: "3px 8px", borderRadius: 6,
    background: "#e8f8f0", color: "#27ae60", fontWeight: 600,
  },
  badgeRed: {
    marginLeft: "auto", fontSize: 11, padding: "3px 8px", borderRadius: 6,
    background: "#fdf0f0", color: "#e74c3c", fontWeight: 600,
  },
  flightRoute: { display: "flex", alignItems: "center", padding: "10px 0", marginBottom: 4 },
  flightAirport: { flex: 1, fontSize: 13, fontWeight: 700, color: "#1a1a2e" },
  chip: {
    fontSize: 12, padding: "3px 10px", borderRadius: 20,
    background: "#f0f6fd", border: "1px solid #dce8f7", color: "#378add",
  },
  seasonRow: { display: "flex", alignItems: "center", padding: "8px 10px", borderRadius: 8 },
  nowBadge: {
    fontSize: 10, background: "#378add", color: "#fff",
    borderRadius: 4, padding: "1px 6px",
  },
  mapOverlay: {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#f4f6f9",
  },
  tmplBtn: {
    background: "#fff", border: "1px solid #dde1e8", borderRadius: 20,
    padding: "8px 16px", fontSize: 13, color: "#5a6478", cursor: "pointer",
  },
};
