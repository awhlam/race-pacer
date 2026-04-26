# Race Pacer

A client-side webapp for planning race splits. Input your distance and target pace, choose a pacing strategy, and get a per-segment breakdown table you can annotate and export — including as a phone wallpaper to reference on race day.

**Live app:** https://awhlam.github.io/race-pacer/

## Features

- **Distance presets** — 5K, 10K, Half Marathon, Marathon, or custom
- **Unit toggle** — km or miles, with automatic pace conversion
- **Pacing strategies** — Even Split, Negative Split (gradually speed up), Positive Split (gradually slow down). Splits use a smooth linear ramp rather than a midpoint step, so the chart reflects how runners actually pace.
- **Variance control** — slider from 1% (subtle) to 8% (aggressive). Bounded to realistic race-day ranges.
- **Warmup option** — opt-in "ease into the first mile" that slows the first 1–2 segments and proportionally redistributes time across the rest.
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

## Tests

```bash
npm test          # one-shot run
npm run test:watch # watch mode
```

The test suite covers the pacing math: format/parse round-trips, segment generation, strategy curve shapes, the warmup invariant, and goal-time preservation across distance × strategy × spread × warmup × unit combinations.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- html2canvas
- Vitest
