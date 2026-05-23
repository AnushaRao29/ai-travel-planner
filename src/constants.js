// ─── CITIES ───────────────────────────────────────────────────────────────────

export const POPULAR_CITIES = [
  { city: "Mumbai",          country: "India" },
  { city: "Delhi",           country: "India" },
  { city: "Bengaluru",       country: "India" },
  { city: "Chennai",         country: "India" },
  { city: "Kolkata",         country: "India" },
  { city: "Hyderabad",       country: "India" },
  { city: "Ahmedabad",       country: "India" },
  { city: "Pune",            country: "India" },
  { city: "New York",        country: "USA" },
  { city: "Los Angeles",     country: "USA" },
  { city: "Chicago",         country: "USA" },
  { city: "San Francisco",   country: "USA" },
  { city: "Miami",           country: "USA" },
  { city: "London",          country: "UK" },
  { city: "Manchester",      country: "UK" },
  { city: "Edinburgh",       country: "UK" },
  { city: "Toronto",         country: "Canada" },
  { city: "Vancouver",       country: "Canada" },
  { city: "Sydney",          country: "Australia" },
  { city: "Melbourne",       country: "Australia" },
  { city: "Berlin",          country: "Germany" },
  { city: "Munich",          country: "Germany" },
  { city: "Paris",           country: "France" },
  { city: "Lyon",            country: "France" },
  { city: "Tokyo",           country: "Japan" },
  { city: "Osaka",           country: "Japan" },
  { city: "Kyoto",           country: "Japan" },
  { city: "Singapore",       country: "Singapore" },
  { city: "Dubai",           country: "UAE" },
  { city: "Abu Dhabi",       country: "UAE" },
  { city: "Shanghai",        country: "China" },
  { city: "Beijing",         country: "China" },
  { city: "São Paulo",       country: "Brazil" },
  { city: "Rio de Janeiro",  country: "Brazil" },
  { city: "Cape Town",       country: "South Africa" },
  { city: "Mexico City",     country: "Mexico" },
  { city: "Cancún",          country: "Mexico" },
  { city: "Rome",            country: "Italy" },
  { city: "Milan",           country: "Italy" },
  { city: "Florence",        country: "Italy" },
  { city: "Madrid",          country: "Spain" },
  { city: "Barcelona",       country: "Spain" },
  { city: "Amsterdam",       country: "Netherlands" },
  { city: "Seoul",           country: "South Korea" },
  { city: "Busan",           country: "South Korea" },
  { city: "Auckland",        country: "New Zealand" },
  { city: "Bangkok",         country: "Thailand" },
  { city: "Phuket",          country: "Thailand" },
  { city: "Chiang Mai",      country: "Thailand" },
  { city: "Bali",            country: "Indonesia" },
  { city: "Jakarta",         country: "Indonesia" },
  { city: "Kuala Lumpur",    country: "Malaysia" },
  { city: "Ho Chi Minh City",country: "Vietnam" },
  { city: "Hanoi",           country: "Vietnam" },
  { city: "Manila",          country: "Philippines" },
  { city: "Colombo",         country: "Sri Lanka" },
  { city: "Kathmandu",       country: "Nepal" },
  { city: "Dhaka",           country: "Bangladesh" },
  { city: "Karachi",         country: "Pakistan" },
  { city: "Cairo",           country: "Egypt" },
  { city: "Istanbul",        country: "Turkey" },
  { city: "Athens",          country: "Greece" },
  { city: "Zurich",          country: "Switzerland" },
  { city: "Vienna",          country: "Austria" },
  { city: "Prague",          country: "Czech Republic" },
  { city: "Budapest",        country: "Hungary" },
  { city: "Lisbon",          country: "Portugal" },
  { city: "Porto",           country: "Portugal" },
  { city: "Stockholm",       country: "Sweden" },
  { city: "Copenhagen",      country: "Denmark" },
  { city: "Oslo",            country: "Norway" },
];

// ─── CURRENCY ─────────────────────────────────────────────────────────────────

export const CURRENCY_MAP = {
  India: "INR",  USA: "USD",  "United States": "USD",
  UK: "GBP",     "United Kingdom": "GBP",
  Canada: "CAD", Australia: "AUD",
  Germany: "EUR", France: "EUR",  Italy: "EUR",   Spain: "EUR",
  Netherlands: "EUR", Austria: "EUR", Portugal: "EUR", Greece: "EUR",
  Japan: "JPY",  Singapore: "SGD", UAE: "AED",
  China: "CNY",  Brazil: "BRL",  "South Africa": "ZAR",
  Mexico: "MXN", "South Korea": "KRW", "New Zealand": "NZD",
  Switzerland: "CHF", Thailand: "THB", Malaysia: "MYR",
  Indonesia: "IDR",   Vietnam: "VND",  Pakistan: "PKR",
  Bangladesh: "BDT",  "Sri Lanka": "LKR", Nepal: "NPR",
  Philippines: "PHP", Turkey: "TRY",   Egypt: "EGP",
  Sweden: "SEK",  Denmark: "DKK",  Norway: "NOK",
  "Czech Republic": "CZK", Hungary: "HUF", Russia: "RUB",
};

// ─── UI COPY ──────────────────────────────────────────────────────────────────

export const QUICK_PICKS = [
  "Paris", "Tokyo", "Bali", "New York", "Rome", "Santorini", "Dubai", "Bangkok",
];

export const TEMPLATES = [
  { label: "💕 Romantic",  fn: (d, n) => `Rewrite as a romantic couples itinerary for ${d} (${n} days).` },
  { label: "🍜 Foodie",    fn: (d, n) => `Focus on food, markets, and restaurants in ${d} (${n} days).` },
  { label: "💰 Budget",    fn: (d, n) => `Make it a budget-friendly ${n}-day trip to ${d}.` },
  { label: "🏔 Off-beat",  fn: (d, n) => `Replace tourist traps with hidden local gems in ${d} (${n} days).` },
];

// ─── MISC ─────────────────────────────────────────────────────────────────────

export const SECTION_KEYS = [
  "ITINERARY", "VISA", "WEATHER", "BUDGET", "FLIGHTS", "TRANSPORT", "TIPS", "PLACES",
];

// Month index 0–11 → season key
export const MONTH_TO_SEASON = {
  0: "peak",    1: "offpeak", 2: "shoulder", 3: "shoulder",
  4: "shoulder",5: "peak",   6: "peak",     7: "offpeak",
  8: "shoulder",9: "shoulder",10:"shoulder", 11: "peak",
};

export const SEASON_COLORS = {
  peak: "#e74c3c", shoulder: "#f39c12", offpeak: "#27ae60",
};
