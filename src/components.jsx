import { useState, useRef, useEffect } from "react";
import {
  useIsMobile, useLeafletMap, isDomestic,
  getTag, getTagInt, getFXRate, fmtMoney, parseRange,
  displayLines, extractPlaces, getCurrentSeason, flightMidpoints, cleanVisaUrl,
} from "./utils";
import { POPULAR_CITIES, SEASON_COLORS } from "./constants";
import {
  T, cardStyle, cardHeaderStyle, cardLabelStyle,
  bulletLineStyle, dividerStyle, linkBtnStyle, badgeStyle,
} from "./styles";

// ─── ATOMS ────────────────────────────────────────────────────────────────────

export function Dot() {
  return <span style={{ color: T.blue, fontWeight: 700, flexShrink: 0 }}>·</span>;
}

export function Divider() {
  return <div style={dividerStyle} />;
}

export function MiniLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
      {children}
    </div>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "5rem 2rem", color: T.faint }}>
      <span style={{ fontSize: 52, display: "block", marginBottom: "1rem" }}>{icon}</span>
      <p>{text}</p>
    </div>
  );
}

export function LoadingState({ text, isRetrying = false }) {
  const color = isRetrying ? T.amber : T.blue;
  return (
    <div style={{ textAlign: "center", padding: "4rem 1.5rem" }}>
      <div style={{ width: 36, height: 36, border: `2px solid ${isRetrying ? "#fde68a" : T.border}`, borderTopColor: color, borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
      {isRetrying && <div style={{ fontSize: 11, fontWeight: 600, color: T.amber, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>⏳ Rate limit — please wait</div>}
      <div style={{ fontSize: 14, color: isRetrying ? T.amber : T.faint }}>{text}</div>
      {isRetrying && <div style={{ fontSize: 12, color: T.faint, marginTop: 8 }}>Groq free tier allows ~5 req/min — your trip will load automatically</div>}
    </div>
  );
}

// ─── CITY DROPDOWN ────────────────────────────────────────────────────────────

export function CityDropdown({ value, onChange, inputStyle }) {
  const isMobile            = useIsMobile();
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef             = useRef(null);
  const searchRef           = useRef(null);

  // ── Close on outside click/touch ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    // Both mouse and touch events
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // ── Focus search input after dropdown opens ───────────────────────────────
  // Don't autoFocus on mobile — it triggers keyboard and shifts layout
  useEffect(() => {
    if (open && !isMobile && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, isMobile]);

  const filtered = POPULAR_CITIES.filter(({ city, country }) =>
    !search ||
    city.toLowerCase().includes(search.toLowerCase()) ||
    country.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, { city, country }) => {
    (acc[country] = acc[country] || []).push(city);
    return acc;
  }, {});

  const select = (city, country) => {
    onChange(`${city}, ${country}`);
    setOpen(false);
    setSearch("");
  };

  // On mobile: full-screen modal overlay instead of absolute dropdown
  // This avoids the dropdown getting cut off or going off-screen
  const dropdownStyle = isMobile ? {
    position:   "fixed",
    top:        0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex:     100,
    display:    "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  } : {
    position:   "absolute",
    top:        "calc(100% + 4px)",
    left:       0, right: 0,
    background: T.white,
    border:     `1px solid ${T.border}`,
    borderRadius: T.radiusSm,
    boxShadow:  "0 4px 16px rgba(0,0,0,0.12)",
    zIndex:     50,
    overflow:   "hidden",
  };

  const sheetStyle = isMobile ? {
    background:         T.white,
    borderRadius:       "16px 16px 0 0",
    maxHeight:          "70vh",
    display:            "flex",
    flexDirection:      "column",
    overflow:           "hidden",
  } : {};

  return (
    <div ref={wrapRef} style={{ position: "relative", marginBottom: 10 }}>
      {/* Trigger button */}
      <button
        style={{
          display: "block",
          width: "100%",
          minHeight: 50,        // guaranteed tap target on mobile
          ...(inputStyle || {}),
          cursor: "pointer",
          textAlign: "left",
          WebkitAppearance: "none",   // fix iOS button styling
          appearance: "none",
        }}
        onClick={() => setOpen(prev => !prev)}
        onTouchEnd={(e) => {
          e.preventDefault();         // prevent ghost click delay on mobile
          setOpen(prev => !prev);
        }}
      >
        ✈ From: {value || "Select your city"}
      </button>

      {open && (
        <div style={dropdownStyle} onClick={isMobile ? (e) => { if (e.target === e.currentTarget) { setOpen(false); setSearch(""); } } : undefined}>
          <div style={sheetStyle}>
            {/* Mobile sheet header */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: `1px solid ${T.borderL}` }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Select departure city</span>
                <button onClick={() => { setOpen(false); setSearch(""); }}
                  style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.muted, padding: "0 4px", lineHeight: 1 }}>×</button>
              </div>
            )}

            {/* Search input */}
            <input
              ref={searchRef}
              type="text"
              placeholder="Search city or country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                border: "none", borderBottom: `1px solid ${T.borderL}`,
                fontSize: 15, outline: "none",
                fontFamily: "inherit", color: T.text,
                boxSizing: "border-box",
                // Larger touch target on mobile
                ...(isMobile ? { padding: "14px 16px", fontSize: 16 } : {}),
              }}
            />

            {/* City list */}
            <div style={{ overflowY: "auto", flex: 1, maxHeight: isMobile ? undefined : 240 }}>
              {Object.entries(grouped).map(([country, cities]) => (
                <div key={country}>
                  <div style={{
                    padding: "6px 14px", fontSize: 10, fontWeight: 700,
                    letterSpacing: "1px", color: T.faint,
                    textTransform: "uppercase", background: T.surface,
                    borderBottom: `0.5px solid ${T.border}`,
                    position: "sticky", top: 0,
                  }}>
                    {country}
                  </div>
                  {cities.map(city => (
                    <div
                      key={city}
                      style={{
                        padding: isMobile ? "14px 16px" : "10px 14px",
                        fontSize: isMobile ? 15 : 13,
                        cursor: "pointer", color: T.text,
                        borderBottom: `0.5px solid ${T.borderL}`,
                        background: value === `${city}, ${country}` ? "#e8f0ff" : T.white,
                        // Tap highlight for mobile
                        WebkitTapHighlightColor: "rgba(55,138,221,0.15)",
                      }}
                      onMouseDown={() => select(city, country)}
                    >
                      {value === `${city}, ${country}` && (
                        <span style={{ color: T.blue, marginRight: 6, fontSize: 12 }}>✓</span>
                      )}
                      {city}
                    </div>
                  ))}
                </div>
              ))}
              {!Object.keys(grouped).length && (
                <div style={{ padding: 16, fontSize: 13, color: T.faint, textAlign: "center" }}>No results for "{search}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION CARD (Itinerary / Weather / Tips) ────────────────────────────────

export function SectionCard({ icon, label, lines }) {
  if (!lines?.length) return null;
  const isItinerary = label === "ITINERARY";
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>{icon}</span><span style={cardLabelStyle}>{label}</span>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {displayLines(lines).map((line, i) => {
          if (isItinerary && /^Day\s+\d+/i.test(line)) {
            return <div key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.5px", color: T.blue, textTransform: "uppercase", marginTop: 14, marginBottom: 4 }}>{line}</div>;
          }
          if (isItinerary) {
            return <div key={i} style={{ fontSize: 13.5, lineHeight: 1.7, color: "#2d3748", padding: "4px 0", borderBottom: `0.5px solid ${T.borderL}` }}>{line}</div>;
          }
          return <div key={i} style={bulletLineStyle}><Dot /><span>{line.replace(/^[-•]\s*/, "")}</span></div>;
        })}
      </div>
    </div>
  );
}

// ─── TRAVEL MAP ───────────────────────────────────────────────────────────────

export function TravelMap({ places, destName }) {
  const isMobile = useIsMobile();
  const mapRef   = useRef(null);
  const status   = useLeafletMap(mapRef, places, destName);
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>🗺️</span><span style={cardLabelStyle}>MAP — PLACES IN YOUR ITINERARY</span>
      </div>
      <div style={{ position: "relative", height: isMobile ? 280 : 400, overflow: "hidden" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {status !== "ready" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.bg }}>
            {status === "loading"
              ? <><div style={{ width: 32, height: 32, border: `2px solid ${T.border}`, borderTopColor: T.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><p style={{ fontSize: 13, color: T.faint, marginTop: 8 }}>Pinning places on map…</p></>
              : <><span style={{ fontSize: 32 }}>🗺️</span><p style={{ fontSize: 13, color: T.faint, marginTop: 8 }}>Map unavailable</p></>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VISA CARD ────────────────────────────────────────────────────────────────

export function VisaCard({ lines, data, dest }) {
  const url  = cleanVisaUrl(getTag(data, "VISA_URL"));
  const free = getTag(data, "VISA_FREE");
  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>🛂</span><span style={cardLabelStyle}>VISA</span>
        {free === "YES" && <span style={badgeStyle("green")}>Visa Free ✓</span>}
        {free === "NO"  && <span style={badgeStyle("red")}>Visa Required</span>}
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {displayLines(lines).map((line, i) => (
          <div key={i} style={bulletLineStyle}><Dot /><span>{line.replace(/^[-•]\s*/, "")}</span></div>
        ))}
        {url
          ? <a href={url} target="_blank" rel="noopener noreferrer" style={linkBtnStyle}>🔗 Official Visa Portal ↗</a>
          : <a href={`https://www.google.com/search?q=${encodeURIComponent(dest + " official visa application")}`} target="_blank" rel="noopener noreferrer" style={{ ...linkBtnStyle, background: T.surface, color: T.muted, borderColor: T.border }}>🔍 Search official visa portal ↗</a>
        }
      </div>
    </div>
  );
}

// ─── BUDGET CARD ──────────────────────────────────────────────────────────────

function TotalRow({ label, sub, value, color }) {
  return (
    <div style={{ background: T.surface, border: `1.5px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: T.radiusSm, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ fontSize: 11, color: T.faint, marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{sub}</div>}
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function SeasonBadge({ label, value, color }) {
  const bg = { [T.green]: "#e8f8f0", [T.blue]: "#e8f2ff", [T.red]: "#fdf0f0" }[color] || "#f0f6fd";
  return <span style={{ fontSize: 10, background: bg, color, borderRadius: 4, padding: "1px 6px" }}>{label} {value}</span>;
}

export function BudgetCard({ lines, data, days }) {
  const isMobile = useIsMobile();
  const [tier, setTier] = useState("mid");

  const currency = getTag(data, "CURRENCY", "USD");
  const fxRate   = getFXRate(data);
  const fxSource = getTag(data, "FX_SOURCE", "ai");
  const tiers = {
    budget: { label: "🎒 Backpacker", daily: getTagInt(data, "BUDGET_BACKPACKER"), color: T.green  },
    mid:    { label: "🏨 Mid-range",  daily: getTagInt(data, "BUDGET_MID"),        color: T.blue   },
    luxury: { label: "✨ Luxury",     daily: getTagInt(data, "BUDGET_LUXURY"),     color: T.purple },
  };
  const { shoulder, peak, offpeak } = flightMidpoints(data);
  const active     = tiers[tier];
  const stayTotal  = (active.daily || 0) * days;
  const grandTotal = shoulder > 0 ? stayTotal + shoulder : 0;
  const aiLines    = displayLines(lines);

  return (
    <div style={cardStyle}>
      <div style={{ ...cardHeaderStyle, flexWrap: "wrap", gap: 6 }}>
        <span>💰</span><span style={cardLabelStyle}>BUDGET — PER PERSON</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 11, color: T.faint }}>1 USD = {fxRate} {currency}</span>
          <span style={badgeStyle(fxSource === "live" ? "green" : "amber")}>{fxSource === "live" ? "✓ Live" : "⚠ Approx"}</span>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        {(tiers.budget.daily > 0 || tiers.mid.daily > 0) ? (
          <>
            {/* Tier pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {Object.entries(tiers).map(([key, t]) => t.daily > 0 && (
                <button key={key} onClick={() => setTier(key)} style={{ padding: "8px 20px", borderRadius: 24, fontSize: 13, fontWeight: 500, border: "1.5px solid", cursor: "pointer", fontFamily: "inherit", background: tier === key ? t.color : T.white, color: tier === key ? T.white : t.color, borderColor: t.color }}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* 2-col layout */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Left: daily rates */}
              <div>
                <MiniLabel>Daily breakdown</MiniLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(tiers).map(([key, t]) => t.daily > 0 && (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: T.radiusSm, background: tier === key ? "#f0f6fd" : T.surface, border: `1px solid ${tier === key ? "#dce8f7" : T.borderL}`, borderLeft: `3px solid ${t.color}` }}>
                      <span style={{ fontSize: 13, color: "#2d3748" }}>{t.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.color }}>{fmtMoney(t.daily, currency)}/day</span>
                    </div>
                  ))}
                </div>
                {aiLines.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <MiniLabel>Local cost details</MiniLabel>
                    {aiLines.slice(0, 6).map((line, i) => <div key={i} style={{ ...bulletLineStyle, fontSize: 13 }}><Dot /><span>{line.replace(/^[-•]\s*/, "")}</span></div>)}
                  </div>
                )}
              </div>
              {/* Right: totals */}
              <div>
                <MiniLabel>Trip totals — {days} days</MiniLabel>
                <TotalRow label={`Stay (${active.label})`} sub={`${fmtMoney(active.daily, currency)}/day × ${days} days`} value={fmtMoney(stayTotal, currency)} color={active.color} />
                {shoulder > 0 ? (
                  <div style={{ background: T.surface, border: `1.5px solid ${T.amber}30`, borderLeft: `3px solid ${T.amber}`, borderRadius: T.radiusSm, padding: "12px 14px", marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: T.faint, marginBottom: 4 }}>Flights (roundtrip)</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      {offpeak > 0 && <SeasonBadge label="Off-peak" value={fmtMoney(offpeak, currency)} color={T.green} />}
                      {shoulder > 0 && <SeasonBadge label="Shoulder" value={fmtMoney(shoulder, currency)} color={T.blue} />}
                      {peak    > 0 && <SeasonBadge label="Peak"     value={fmtMoney(peak, currency)}    color={T.red} />}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: T.amber }}>{fmtMoney(shoulder, currency)}</div>
                  </div>
                ) : (
                  <div style={{ background: T.surface, border: `1px solid ${T.borderL}`, borderRadius: T.radiusSm, padding: "10px 14px", marginBottom: 8, fontSize: 12, color: T.faint }}>✈️ See flights section for flight cost</div>
                )}
                <div style={{ background: "linear-gradient(135deg,#378add15,#7c5cbf15)", border: `1.5px solid ${T.blue}40`, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, textTransform: "uppercase", letterSpacing: "0.5px" }}>{grandTotal > 0 ? "Grand total" : "Stay total"}</div>
                    <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{grandTotal > 0 ? "Stay + flights · per person" : "Excl. flights · per person"}</div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: T.blue }}>{fmtMoney(grandTotal > 0 ? grandTotal : stayTotal, currency)}</div>
                </div>
              </div>
            </div>
            {aiLines.length > 6 && (
              <><Divider /><div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "4px 16px" }}>
                {aiLines.slice(6).map((line, i) => <div key={i} style={{ ...bulletLineStyle, fontSize: 13 }}><Dot /><span>{line.replace(/^[-•]\s*/, "")}</span></div>)}
              </div></>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: T.faint }}>Budget data not available.</p>
        )}
      </div>
    </div>
  );
}


// ─── TRANSPORT CARD (domestic trips) ─────────────────────────────────────────

export function TransportCard({ lines, data, origin, dest }) {
  const isMobile  = useIsMobile();
  const currency  = getTag(data, "CURRENCY", "INR");
  const mode      = getTag(data, "TRANSPORT_MODE");
  const operators = getTag(data, "TRANSPORT_OPERATORS");
  const duration  = getTag(data, "TRANSPORT_DURATION");
  const priceLow  = getTag(data, "TRANSPORT_PRICE_LOW");
  const priceMid  = getTag(data, "TRANSPORT_PRICE_MID");
  const priceHigh = getTag(data, "TRANSPORT_PRICE_HIGH");
  const peakMonths    = getTag(data, "FLIGHT_PEAK_MONTHS") || getTag(data, "TRANSPORT_PEAK_MONTHS");
  const offpeakMonths = getTag(data, "FLIGHT_OFFPEAK_MONTHS") || getTag(data, "TRANSPORT_OFFPEAK_MONTHS");
  const currentSeason = getCurrentSeason();
  const aiLines   = displayLines(lines);

  const modeIcon = {
    train: "🚂", bus: "🚌", flight: "✈️", "train+local": "🚂", default: "🚌",
  }[mode?.toLowerCase()] || "🚌";

  const prices = [
    { label: "Budget",    value: priceLow,  color: "#27ae60", note: "sleeper / state bus" },
    { label: "Mid-range", value: priceMid,  color: T.blue,    note: "3AC / private bus" },
    { label: "Comfort",   value: priceHigh, color: T.purple,  note: "2AC / flight / premium" },
  ].filter(p => p.value && parseInt(p.value) > 0);

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span>{modeIcon}</span>
        <span style={cardLabelStyle}>HOW TO GET THERE</span>
        {mode && <span style={{ marginLeft: "auto", fontSize: 11, background: "#f0f6fd", color: T.blue, border: "1px solid #dce8f7", borderRadius: 4, padding: "2px 8px", fontWeight: 600, textTransform: "uppercase" }}>
          Best: {mode}
        </span>}
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>

        {/* Route + duration */}
        {(origin || dest) && (
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", padding: "8px 0 12px", gap: isMobile ? 2 : 0, borderBottom: `1px solid ${T.borderL}` }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.text }}>{origin}</div>
            <div style={{ color: T.blue, fontSize: 13, padding: isMobile ? "2px 0" : "0 10px" }}>→ {modeIcon} →</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.text }}>{dest}</div>
          </div>
        )}
        {duration && <div style={{ fontSize: 12, color: T.faint, marginBottom: 8 }}>~{duration}</div>}

        {/* Operators */}
        {operators && (
          <div style={{ marginBottom: 12 }}>
            <MiniLabel>Options</MiniLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {operators.split(",").map(op => (
                <span key={op.trim()} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#f0f6fd", border: "1px solid #dce8f7", color: T.blue }}>{op.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* Price tiers */}
        {prices.length > 0 && (
          <>
            <Divider />
            <MiniLabel>Roundtrip cost per person</MiniLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {prices.map(p => (
                <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: T.radiusSm, background: T.surface, borderLeft: `3px solid ${p.color}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#2d3748" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: T.faint }}>{p.note}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: p.color }}>{fmtMoney(parseInt(p.value), currency)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Season notes */}
        {(peakMonths || offpeakMonths) && (
          <>
            <Divider />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {peakMonths && (
                <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#e74c3c", fontWeight: 600 }}>🔴 Peak:</span>
                  <span style={{ color: T.muted }}>{peakMonths} — book early, prices higher</span>
                </div>
              )}
              {offpeakMonths && (
                <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#27ae60", fontWeight: 600 }}>🟢 Off-peak:</span>
                  <span style={{ color: T.muted }}>{offpeakMonths} — easier availability, better rates</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI narrative */}
        {aiLines.length > 0 && (
          <>
            <Divider />
            {aiLines.map((l, i) => (
              <div key={i} style={bulletLineStyle}><Dot /><span>{l.replace(/^[-•]\s*/, "")}</span></div>
            ))}
          </>
        )}

        <Divider />
        <div style={{ fontSize: 11, color: T.faint, marginBottom: 8 }}>Prices are estimates — book on IRCTC (trains), redBus, Abhibus, or airline websites.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "🚂 IRCTC",   url: "https://www.irctc.co.in" },
            { label: "🚌 redBus",  url: `https://www.redbus.in/bus-tickets/${encodeURIComponent(origin.split(",")[0].toLowerCase())}-to-${encodeURIComponent(dest.toLowerCase())}` },
            { label: "✈ IndiGo",  url: "https://www.goindigo.in" },
          ].map(lk => (
            <a key={lk.label} href={lk.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, color: T.muted, textDecoration: "none", background: T.surface }}>
              {lk.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FLIGHTS CARD ─────────────────────────────────────────────────────────────

export function FlightsCard({ lines, data, origin, dest }) {
  const isMobile      = useIsMobile();
  const currency      = getTag(data, "CURRENCY", "USD");
  const airlines      = getTag(data, "FLIGHT_AIRLINES");
  const fromAirport   = getTag(data, "FLIGHT_FROM_AIRPORT");
  const toAirport     = getTag(data, "FLIGHT_TO_AIRPORT");
  const duration      = getTag(data, "FLIGHT_DURATION");
  const currentSeason = getCurrentSeason();

  const seasons = [
    { key: "peak",     label: "Peak",     range: getTag(data, "FLIGHT_PRICE_PEAK"),     months: getTag(data, "FLIGHT_PEAK_MONTHS"),     color: SEASON_COLORS.peak     },
    { key: "shoulder", label: "Shoulder", range: getTag(data, "FLIGHT_PRICE_SHOULDER"), months: getTag(data, "FLIGHT_SHOULDER_MONTHS"), color: SEASON_COLORS.shoulder },
    { key: "offpeak",  label: "Off-peak", range: getTag(data, "FLIGHT_PRICE_OFFPEAK"),  months: getTag(data, "FLIGHT_OFFPEAK_MONTHS"),  color: SEASON_COLORS.offpeak  },
  ];
  const aiLines = displayLines(lines);

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle}><span>✈️</span><span style={cardLabelStyle}>FLIGHTS — ROUNDTRIP ESTIMATE</span></div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {!airlines && !fromAirport && !seasons[0].range ? (
          <p style={{ fontSize: 13, color: T.faint }}>Flight data unavailable for this route.</p>
        ) : (
          <>
            {/* Route */}
            {(fromAirport || toAirport) && (
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", padding: "10px 0", marginBottom: 4, gap: isMobile ? 2 : 0 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.text }}>{fromAirport || origin}</div>
                <div style={{ color: T.blue, fontSize: 13, padding: isMobile ? "2px 0" : "0 8px" }}>→ ✈ →</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.text }}>{toAirport || dest}</div>
              </div>
            )}
            {duration && <div style={{ fontSize: 12, color: T.faint, marginBottom: 12 }}>~{duration}</div>}
            {/* Airlines */}
            {airlines && (
              <div style={{ marginBottom: 12 }}>
                <MiniLabel>Recommended airlines</MiniLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {airlines.split(",").map(a => <span key={a.trim()} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "#f0f6fd", border: "1px solid #dce8f7", color: T.blue }}>{a.trim()}</span>)}
                </div>
              </div>
            )}
            <Divider /><MiniLabel>Roundtrip price per person</MiniLabel>
            {/* Seasonal prices */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, marginBottom: 8 }}>
              {seasons.map(({ key, label, range, months, color }) => {
                const isCurrent = key === currentSeason;
                const [lo, hi]  = parseRange(range);
                return (
                  <div key={key} style={{ background: isCurrent ? "#f0f6fd" : T.surface, border: `1px solid ${isCurrent ? "#dce8f7" : T.borderL}`, borderLeft: `3px solid ${color}`, borderRadius: T.radiusSm, padding: "8px 10px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 3 : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? T.blue : "#2d3748", display: "flex", alignItems: "center", gap: 6 }}>
                        {label}
                        {isCurrent && <span style={{ fontSize: 10, background: T.blue, color: T.white, borderRadius: 4, padding: "1px 6px" }}>Now</span>}
                      </div>
                      {months && <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{months}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? T.blue : T.text, marginTop: isMobile ? 4 : 0 }}>
                      {lo > 0 ? `${currency} ${lo.toLocaleString()} – ${hi.toLocaleString()}` : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
            {aiLines.length > 0 && <><Divider />{aiLines.map((l, i) => <div key={i} style={bulletLineStyle}><Dot /><span>{l.replace(/^[-•]\s*/, "")}</span></div>)}</>}
          </>
        )}
        <Divider />
        <div style={{ fontSize: 11, color: T.faint, marginBottom: 8 }}>Prices are AI estimates — verify on booking sites before purchasing.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "🔍 Google Flights", url: `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(origin)}+to+${encodeURIComponent(dest)}` },
            { label: "✈ Skyscanner",      url: `https://www.skyscanner.com/transport/flights/${encodeURIComponent(origin)}/${encodeURIComponent(dest)}/` },
            { label: "🇮🇳 MakeMyTrip",   url: "https://www.makemytrip.com/flights/" },
          ].map(lk => (
            <a key={lk.label} href={lk.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, padding: "5px 12px", borderRadius: T.radiusSm, border: `1px solid ${T.border}`, color: T.muted, textDecoration: "none", background: T.surface }}>{lk.label} ↗</a>
          ))}
        </div>
      </div>
    </div>
  );
}
