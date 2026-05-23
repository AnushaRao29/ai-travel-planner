import { useState } from "react";
import { HeroPage, PlannerPage } from "./pages";

export default function App() {
  const [page,       setPage]       = useState("hero");
  const [tripDest,   setTripDest]   = useState("");
  const [tripDays,   setTripDays]   = useState(5);
  const [tripOrigin, setTripOrigin] = useState("Bengaluru, India");

  const handleStart = (dest, days, origin) => {
    setTripDest(dest); setTripDays(days); setTripOrigin(origin); setPage("planner");
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {page === "hero"    && <HeroPage onStart={handleStart} />}
      {page === "planner" && <PlannerPage key={`${tripDest}-${tripDays}-${tripOrigin}`} initialDest={tripDest} initialDays={tripDays} initialOrigin={tripOrigin} onBack={() => setPage("hero")} />}
    </div>
  );
}
