import { useState, useRef } from "react";
import { useIsMobile, useServerWake, useTripData, extractPlaces, isDomestic } from "./utils";
import { QUICK_PICKS, TEMPLATES } from "./constants";
import { T, heroShell, starsStyle, moonStyle, glassInput, ctrlInputStyle, ctrlBtnStyle } from "./styles";
import {
  CityDropdown, SectionCard, TravelMap,
  VisaCard, BudgetCard, FlightsCard, TransportCard,
  EmptyState, LoadingState,
} from "./components";

// ─── HERO PAGE ────────────────────────────────────────────────────────────────

export function HeroPage({ onStart }) {
  const isMobile       = useIsMobile();
  const { waking }     = useServerWake();
  const [dest,   setDest]   = useState("");
  const [days,   setDays]   = useState(5);
  const [origin, setOrigin] = useState("Bengaluru, India");

  const go = (prefilled) => {
    const d = prefilled || dest;
    if (d.trim()) onStart(d.trim(), days, origin);
  };

  return (
    <div style={heroShell}>
      <div style={starsStyle} />
      <div style={moonStyle} />
      <div style={{ position: "absolute", top: "16%", left: "7%", fontSize: 40, opacity: 0.12, transform: "rotate(15deg)" }}>✈</div>

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 680, width: "100%" }}>
        {/* Badge */}
        <div style={{ display: "inline-block", fontSize: 11, fontWeight: 500, letterSpacing: "1.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", border: "0.5px solid rgba(255,255,255,0.15)", padding: "5px 16px", borderRadius: 20, marginBottom: "1.5rem" }}>
          AI Travel Planner
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(2rem,6vw,3.8rem)", fontWeight: 600, lineHeight: 1.1, color: "#fff", marginBottom: "1rem" }}>
          Your next trip,{" "}
          <span style={{ background: "linear-gradient(135deg,#7eb8f7,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            planned in seconds
          </span>
        </h1>

        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: "2.5rem" }}>
          Tell us where you're from and where you're headed.<br />
          We'll craft a day-by-day itinerary with real costs.
        </p>

        {/* Search card */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "1.5rem", marginBottom: "1.5rem", backdropFilter: isMobile ? "none" : "blur(12px)", position: "relative", zIndex: 2 }}>
          <CityDropdown value={origin} onChange={setOrigin} inputStyle={glassInput} />
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            <input style={glassInput} type="text" placeholder="Where to? e.g. Paris, Bali, Tokyo…"
              value={dest} onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} />
            <div style={{ display: "flex", gap: 10 }}>
              <input style={{ ...glassInput, width: isMobile ? "100%" : 80, flex: isMobile ? 1 : "none", textAlign: "center" }}
                type="number" min={1} max={30} value={days} onChange={e => setDays(Number(e.target.value))} />
              <button style={{ background: "linear-gradient(135deg,#378add,#7c5cbf)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 500, padding: "13px 24px", cursor: "pointer", whiteSpace: "nowrap", flex: isMobile ? 1 : "none" }}
                onClick={() => go()}>Plan →</button>
            </div>
          </div>
        </div>

        {/* Quick picks */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Try:</span>
          {QUICK_PICKS.map(city => (
            <button key={city} style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 15px", fontSize: 13, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
              onClick={() => { setDest(city); go(city); }}>{city}</button>
          ))}
        </div>

        {/* Server wake indicator */}
        {waking && (
          <div style={{ marginTop: "1rem", fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.amber, animation: "spin 1s linear infinite" }} />
            Waking server… first load takes ~20s on free tier
          </div>
        )}
        <p style={{ marginTop: "1rem", fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.5px" }}>
          Powered by Groq + LLaMA 3.1
        </p>
      </div>
    </div>
  );
}

// ─── PLANNER PAGE ─────────────────────────────────────────────────────────────

export function PlannerPage({ initialDest, initialDays, initialOrigin, onBack }) {
  const isMobile = useIsMobile();
  const [dest, setDest] = useState(initialDest);
  const [days, setDays] = useState(initialDays);
  const origin          = initialOrigin;
  const didInit         = useRef(false);

  const { parsed, rawText, loading, error, loadingMsg, generate } = useTripData();
  const [copyLabel, setCopy] = useState("Copy");

  if (!didInit.current) { didInit.current = true; setTimeout(() => generate(initialDest, initialDays, initialOrigin), 0); }

  const { sections = {}, data = {} } = parsed || {};
  const mapPlaces = extractPlaces(sections["PLACES"] || []);
  const copyText  = () => navigator.clipboard?.writeText(rawText).then(() => { setCopy("Copied!"); setTimeout(() => setCopy("Copy"), 2000); });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: T.bg }}>

      {/* Sticky header */}
      <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "0.9rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "7px 13px", fontSize: 13, color: T.muted, cursor: "pointer" }} onClick={onBack}>← Back</button>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>✈ Trip<span style={{ color: T.blue }}>AI</span></div>
        </div>
        {/* Desktop */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input style={{ ...ctrlInputStyle, width: 170 }} type="text" placeholder="Destination" value={dest}
              onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === "Enter" && generate(dest, days, origin)} />
            <input style={{ ...ctrlInputStyle, width: 68, textAlign: "center" }} type="number" min={1} max={30} value={days}
              onChange={e => setDays(Number(e.target.value))} />
            <button style={{ ...ctrlBtnStyle, opacity: loading ? 0.45 : 1 }} onClick={() => generate(dest, days, origin)} disabled={loading}>Generate</button>
          </div>
        )}
        {/* Mobile */}
        {isMobile && (
          <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 8 }}>
            <input style={{ ...ctrlInputStyle, flex: 1, minWidth: 0 }} type="text" placeholder="Destination" value={dest}
              onChange={e => setDest(e.target.value)} onKeyDown={e => e.key === "Enter" && generate(dest, days, origin)} />
            <input style={{ ...ctrlInputStyle, width: 52, textAlign: "center", flexShrink: 0 }} type="number" min={1} max={30} value={days}
              onChange={e => setDays(Number(e.target.value))} />
            <button style={{ ...ctrlBtnStyle, flexShrink: 0, opacity: loading ? 0.45 : 1 }} onClick={() => generate(dest, days, origin)} disabled={loading}>Go</button>
          </div>
        )}
      </header>

      {/* Body */}
      <div style={{ flex: 1, padding: "2rem 1rem", maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {!loading && !parsed && !error && <EmptyState icon="🗺️" text="Enter a destination and hit Generate" />}
        {loading && <LoadingState text={loadingMsg || `Asking Groq AI to plan your trip from ${origin} to ${dest}…`} isRetrying={!!loadingMsg} />}
        {!loading && error && <EmptyState icon="⚠️" text={<>Something went wrong.<br /><small style={{ color: "#c0392b" }}>{error}</small></>} />}

        {!loading && parsed && (
          <>
            {/* Top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, color: T.text }}>{dest}</div>
                <div style={{ fontSize: 13, color: T.faint, marginTop: 3 }}>{days}-day itinerary · from {origin} · Groq AI</div>
              </div>
              <button style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "7px 14px", fontSize: 12, color: T.muted, cursor: "pointer", whiteSpace: "nowrap" }} onClick={copyText}>{copyLabel}</button>
            </div>

            {(() => {
              const domestic = isDomestic(data);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {sections["ITINERARY"] && <SectionCard icon="🗓" label="ITINERARY" lines={sections["ITINERARY"]} />}
                  <TravelMap places={mapPlaces} destName={dest} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                    {/* Visa only for international */}
                    {!domestic && sections["VISA"]    && <VisaCard    lines={sections["VISA"]}    data={data} dest={dest} />}
                    {sections["WEATHER"] && <SectionCard icon="🌤" label="WEATHER"  lines={sections["WEATHER"]} />}
                    {sections["TIPS"]    && <SectionCard icon="💡" label="TIPS"     lines={sections["TIPS"]} />}
                  </div>
                  <BudgetCard lines={sections["BUDGET"] || []} data={data} days={days} />
                  {/* Transport card for domestic, Flights card for international */}
                  {domestic
                    ? <TransportCard lines={sections["TRANSPORT"] || []} data={data} origin={origin} dest={dest} />
                    : <FlightsCard   lines={sections["FLIGHTS"]   || []} data={data} origin={origin} dest={dest} />
                  }
                </div>
              );
            })()}

            {/* Variations */}
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ fontSize: 11, color: T.faint, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Variations</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TEMPLATES.map(t => (
                  <button key={t.label} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 20, padding: "8px 16px", fontSize: 13, color: T.muted, cursor: "pointer" }}
                    onClick={() => generate(`${dest} — ${t.fn(dest, days)}`, days, origin)}>{t.label}</button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
