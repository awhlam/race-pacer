# Race Pacer

A client-side webapp for planning race splits. Input your distance and target pace, choose a pacing strategy, and get a per-segment breakdown table you can annotate and export — including as a phone wallpaper to reference on race day.

## Features

- **Distance presets** — 5K, 10K, Half Marathon, Marathon, or custom
- **Unit toggle** — km or miles, with automatic pace conversion
- **Pacing strategies** — Even Split, Negative Split, Positive Split, Progressive
- **Variance control** — slider to set how aggressive the split difference is
- **Pace table** — per-segment pace, segment time, cumulative time, and editable notes (e.g. "take gel here")
- **Pace chart** — bar chart showing the strategy shape with an average pace reference line
- **Export** — CSV download, Google Sheets clipboard copy, or image (Auto / Phone Wallpaper 1080×1920 / A4 Print / Square)

## Running locally

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Building for production

```bash
npm run build
```

Static output is written to `dist/`. Serve it with any static file host (Netlify, Vercel, GitHub Pages, etc.) — no backend required.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- html2canvas
