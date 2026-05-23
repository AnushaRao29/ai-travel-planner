import { useState, useEffect, useRef } from "react";
import { CURRENCY_MAP, SECTION_KEYS, MONTH_TO_SEASON } from "./constants";

// ─── API CONFIG ───────────────────────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_API_URL || "https://ai-travel-planner-server1.onrender.com";
export const API_URL    = `${BASE_URL}/api/generate-itinerary`;
export const HEALTH_URL = `${BASE_URL}/api/health`;

export const buildRequestBody = (dest, days, origin) => ({ destination: dest, days, origin });

// ─── ORIGIN / CURRENCY ────────────────────────────────────────────────────────

export function getOriginCountry(origin = "") {
  return origin.includes(",") ? origin.split(",").pop().trim() : origin.trim();
}

export function getCurrency(origin = "") {
  return CURRENCY_MAP[getOriginCountry(origin)] || "USD";
}

// ─── RESPONSE PARSER ─────────────────────────────────────────────────────────

export function parseResponse(text) {
  const clean = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");

  // Collect all DATA_ tags — later tags (from CONVERTED section) overwrite earlier ones
  const data = {};
  for (const line of clean.split("\n")) {
    const m = line.match(/^DATA_([A-Z_]+):\s*(.+)$/);
    if (m) data[m[1]] = m[2].trim();
  }

  // Parse display sections — skip the internal CONVERTED section
  const SKIP = new Set(["CONVERTED"]);
  const sections = {};
  let current = null, buf = [];

  for (const line of clean.split("\n")) {
    const t = line.trim();
    const h = t.match(/^==([A-Z]+)==$/);
    if (h) {
      if (current && !SKIP.has(current)) sections[current] = buf;
      current = h[1]; buf = []; continue;
    }
    const plain = SECTION_KEYS.find((k) => t.toUpperCase() === k);
    if (plain) {
      if (current && !SKIP.has(current)) sections[current] = buf;
      current = plain; buf = []; continue;
    }
    if (current && !SKIP.has(current) && t && !t.match(/^DATA_[A-Z_]+:/)) buf.push(t);
  }
  if (current && !SKIP.has(current)) sections[current] = buf;

  return { sections, data };
}

// ─── DATA TAG HELPERS ─────────────────────────────────────────────────────────

export const getTag    = (data, key, fb = "")  => data[key] || fb;
export const getTagInt = (data, key, fb = 0)   => { const v = data[key]; if (!v) return fb; const n = parseInt(v.replace(/[^0-9]/g, ""), 10); return isNaN(n) ? fb : n; };
export const isDomestic  = (data) => (data["IS_DOMESTIC"] || "").toUpperCase() === "YES";
export const getFXRate = (data)                => { const v = data["FX_RATE"]; if (!v) return 1; const f = parseFloat(v); return isNaN(f) || f <= 0 ? 1 : f; };
export const fmtMoney  = (amount, currency)    => amount ? `${currency} ${Number(amount).toLocaleString()}` : "—";

export function parseRange(str = "") {
  const parts = str.split(/\s*[-–]\s*/)
    .map(s => { const m = s.match(/^[\d,]+/); return m ? parseInt(m[0].replace(/,/g, ""), 10) : NaN; })
    .filter(n => !isNaN(n) && n > 0);
  if (parts.length >= 2) return [parts[0], parts[1]];
  if (parts.length === 1) return [parts[0], parts[0]];
  return [0, 0];
}

export const displayLines  = (lines = []) => lines.filter(l => !l.match(/^DATA_[A-Z_]+:/));
export const extractPlaces = (lines = []) => lines.map(l => l.replace(/^[-•]\s*/, "").trim()).filter(l => l.length > 3 && l.includes(","));
export const getCurrentSeason = () => MONTH_TO_SEASON[new Date().getMonth()] || "shoulder";

export function flightMidpoints(data) {
  const mid = tag => { const [a, b] = parseRange(getTag(data, tag)); return a > 0 ? Math.round((a + b) / 2) : 0; };
  return { peak: mid("FLIGHT_PRICE_PEAK"), shoulder: mid("FLIGHT_PRICE_SHOULDER"), offpeak: mid("FLIGHT_PRICE_OFFPEAK") };
}

export function cleanVisaUrl(raw = "") {
  const t = raw.replace(/^\[/, "").replace(/\]$/, "").split(" ")[0].replace(/[.,;)]+$/, "").trim();
  if (!t) return "";
  return !t.startsWith("http") && t.includes(".") ? "https://" + t : t;
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return isMobile;
}

export function useServerWake() {
  const [waking, setWaking] = useState(true);
  useEffect(() => {
    let attempts = 0;
    const ping = async () => {
      try { const r = await fetch(HEALTH_URL); if (r.ok) { setWaking(false); return; } } catch (_) {}
      if (++attempts < 3) setTimeout(ping, 4000);
      else setWaking(false);
    };
    ping();
  }, []);
  return { waking };
}

export function useTripData() {
  const [parsed,     setParsed]     = useState(null);
  const [rawText,    setRawText]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(null);

  async function generate(dest, days, origin) {
    setLoading(true); setParsed(null); setError(null); setLoadingMsg(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequestBody(dest, days, origin)),
      });

      if (res.status === 429) {
        let errJson = {}; try { errJson = await res.json(); } catch (_) {}
        const waitMs  = errJson.retryAfterMs || 65000;
        const isTPD   = errJson.isTPD === true;

        if (isTPD) {
          // Daily limit hit — no point auto-retrying, just show a clear message
          const waitMins = Math.ceil(waitMs / 60000);
          throw new Error(`Daily AI limit reached — Groq free tier allows 500k tokens/day. Please try again in ~${waitMins} minutes.`);
        }

        // Per-minute limit — countdown and auto-retry
        let remaining = Math.ceil(waitMs / 1000);
        setLoadingMsg(`Rate limited — auto-retrying in ${remaining}s…`);
        const interval = setInterval(() => {
          remaining--;
          setLoadingMsg(remaining > 0 ? `Auto-retrying in ${remaining}s…` : "Retrying now…");
          if (remaining <= 0) clearInterval(interval);
        }, 1000);
        await new Promise(r => setTimeout(r, waitMs));
        clearInterval(interval);
        setLoadingMsg("Retrying now…");
        const retry = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildRequestBody(dest, days, origin)) });
        if (!retry.ok) throw new Error("Still rate limited — please wait a minute and try again.");
        const rj = await retry.json();
        if (rj.error) throw new Error(rj.error);
        setRawText(rj.itinerary || "");
        setParsed(parseResponse(rj.itinerary || ""));
        return;
      }

      if (!res.ok) {
        let errJson = {}; try { errJson = await res.json(); } catch (_) {}
        throw new Error(errJson.error || `Server error ${res.status}`);
      }

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setRawText(json.itinerary || "");
      setParsed(parseResponse(json.itinerary || ""));
    } catch (err) {
      setError(err.message.includes("fetch") ? "Could not reach the server — please try again in 30 seconds." : err.message);
    } finally {
      setLoading(false); setLoadingMsg(null);
    }
  }

  return { parsed, rawText, loading, error, loadingMsg, generate };
}

export function useLeafletMap(mapRef, places, destName) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () => new Promise(resolve => {
      if (window.L) { resolve(); return; }
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = resolve; document.head.appendChild(s);
    });

    const geocode = async query => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { "User-Agent": "TravelPlannerApp/1.0" } });
        const d = await r.json();
        if (d?.[0]) return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: query };
      } catch (_) {}
      return null;
    };

    const init = async () => {
      await loadLeaflet();
      if (cancelled || !mapRef.current) return;
      if (mapRef.current._leaflet_id) { mapRef.current._leaflet_id = null; mapRef.current.innerHTML = ""; }

      const map = window.L.map(mapRef.current, { scrollWheelZoom: false });
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO", maxZoom: 19, subdomains: "abcd",
      }).addTo(map);

      const toGeocode = places.length > 0 ? places.slice(0, 10) : [destName];
      const coords = [];
      for (const place of toGeocode) {
        if (cancelled) return;
        const c = await geocode(place);
        if (c) coords.push(c);
        await new Promise(r => setTimeout(r, 400));
      }
      if (coords.length === 0) { const fb = await geocode(destName); if (fb) coords.push(fb); }
      if (cancelled || coords.length === 0) { setStatus("error"); return; }

      coords.forEach((c, i) => {
        const icon = window.L.divIcon({
          html: `<div style="background:linear-gradient(135deg,#378add,#7c5cbf);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${i + 1}</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14],
        });
        window.L.marker([c.lat, c.lon], { icon }).addTo(map).bindPopup(`<b style="font-size:13px">${c.name}</b>`);
      });

      const bounds = coords.map(c => [c.lat, c.lon]);
      bounds.length === 1 ? map.setView(bounds[0], 12) : map.fitBounds(bounds, { padding: [40, 40] });
      setStatus("ready");
    };

    init();
    return () => { cancelled = true; };
  }, [places.join("|"), destName]);

  return status;
}
