# AI Travel Planner ✈️

Generate personalized day-by-day travel itineraries with AI. Enter a destination, trip length, and origin, then let the planner create a complete itinerary in seconds.

## Overview

This is a React + Vite frontend for an AI-powered travel planner. The app lets users:

- Generate itinerary suggestions for a destination and number of days
- Customize the trip style using quick prompts
- View structured travel details, budget summaries, and map-ready places
- Retry or regenerate itineraries when the backend is waking up

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS
- **UI / Animation:** Framer Motion
- **API client:** Fetch + Axios
- **Markdown rendering:** React Markdown
- **Backend:** External API hosted by the travel planner server

## Project Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Environment Variables

The app uses the following optional environment variable:

- `VITE_API_URL` — base URL for the backend API. If omitted, it falls back to the deployed Render server.

Example `.env.local`:

```bash
VITE_API_URL=http://localhost:3000
```

## Local Development

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env.local` file if you want to point the app at a local backend
4. Start the dev server:

   ```bash
   npm run dev
   ```
5. Open the local Vite URL shown in the terminal

## Features

- AI-generated itineraries by destination and duration
- Day-by-day itinerary parsing and sectioned output
- Budget estimation cards
- Travel tips, weather, and planning helpers
- Responsive UI with animated transitions

## Deployment

- **Frontend:** Vite build output hosted on your preferred static host
- **Backend:** Render (or another Node.js-compatible host)

If you are deploying the frontend separately, make sure `VITE_API_URL` points to your backend endpoint.

## Notes

The frontend expects the backend to expose:

- `GET /api/health`
- `POST /api/generate-itinerary`

If your backend URL changes, update `VITE_API_URL` or the app will use the default deployed endpoint.
