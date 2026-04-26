import type { RaceConfig, PaceSegment } from '../types'
import { KM_PER_MILE } from '../types'

/** Format seconds as "M:SS" (e.g. 285 → "4:45") */
export function formatPace(secs: number): string {
  // Round first so a value like 299.6 doesn't yield "4:60"
  const total = Math.round(secs)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format total seconds as "H:MM:SS" or "MM:SS" */
export function formatTime(totalSecs: number): string {
  const total = Math.round(totalSecs)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Parse a "M:SS" or "MM:SS" pace string into seconds. Returns NaN on invalid input. */
export function parsePaceInput(input: string): number {
  const trimmed = input.trim()
  const match = trimmed.match(/^(\d+):([0-5]\d)$/)
  if (!match) return NaN
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
}

/** Parse a "H:MM" total-time string (hours:minutes) into seconds. Returns NaN on invalid input. */
export function parseTimeInput(input: string): number {
  const trimmed = input.trim()
  const match = trimmed.match(/^(\d+):([0-5]\d)$/)
  if (!match) return NaN
  return parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60
}

/** Format total seconds as "H:MM" (hours:minutes, e.g. 13500 → "3:45") */
export function formatHourMin(totalSecs: number): string {
  // Round to whole minutes first so we never produce "0:60"
  const totalMin = Math.round(totalSecs / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Calculate the total distance of the race in the chosen display unit.
 */
function raceDistanceInUnit(config: RaceConfig): number {
  return config.unit === 'km'
    ? config.distanceKm
    : config.distanceKm / KM_PER_MILE
}

/**
 * Get the per-segment pace (in seconds/unit) for each segment index,
 * applying the chosen pacing strategy.
 *
 * P = target pace, S = spreadPercent/100, N = full segment count
 *
 * even:     pace[i] = P
 * negative: pace[i] = P*(1+S/2) - P*S*(i/(N-1))   (linear, start slow → end fast)
 * positive: pace[i] = P*(1-S/2) + P*S*(i/(N-1))   (linear, start fast → end slow)
 *
 * Both negative and positive use a linear ramp rather than a midpoint step
 * function — real fatigue/effort changes are gradual, not binary at halfway.
 */
function segmentPace(
  index: number,
  totalFullSegments: number,
  config: RaceConfig,
): number {
  const P = config.targetPaceSecsPerUnit
  const S = config.spreadPercent / 100
  const N = totalFullSegments

  switch (config.strategy) {
    case 'even':
      return P

    case 'negative': {
      if (N <= 1) return P
      return P * (1 + S / 2) - P * S * (index / (N - 1))
    }

    case 'positive': {
      if (N <= 1) return P
      return P * (1 - S / 2) + P * S * (index / (N - 1))
    }
  }
}

/**
 * Generate all pace segments for the race.
 * Handles a fractional final segment (e.g. a marathon in miles has 26 full
 * miles + a 0.2188-mile final segment).
 */
export function generateSegments(
  config: RaceConfig,
  notes: string[],
): PaceSegment[] {
  const totalDistance = raceDistanceInUnit(config)
  const fullSegments = Math.floor(totalDistance)
  const remainder = totalDistance - fullSegments

  // Total number of rows (may include a partial final row)
  const totalRows = remainder > 0.001 ? fullSegments + 1 : fullSegments

  const segments: PaceSegment[] = []
  let cumulative = 0

  for (let i = 0; i < totalRows; i++) {
    const isPartial = i === fullSegments && remainder > 0.001
    const segmentDistance = isPartial ? remainder : 1.0

    // The partial final segment inherits the last full segment's pace so the
    // chart smoothly continues the closing pace through the finish line. This
    // introduces a tiny goal-time error proportional to remainder × P × S/2 —
    // sub-second at typical 1–3% spread, ~4s at the 8% max on a marathon —
    // which is well below what's perceptible mid-race.
    const strategyIdx = isPartial ? Math.max(fullSegments - 1, 0) : i
    const pace = segmentPace(strategyIdx, Math.max(fullSegments, 1), config)
    const segmentTime = pace * segmentDistance
    cumulative += segmentTime

    segments.push({
      segmentNum: i + 1,
      segmentDistance,
      paceSecsPerUnit: pace,
      segmentTimeSecs: segmentTime,
      cumulativeTimeSecs: cumulative,
      note: notes[i] ?? '',
    })
  }

  return segments
}

/** Compute the average pace across all segments (weighted by distance). */
export function averagePace(segments: PaceSegment[]): number {
  if (segments.length === 0) return 0
  const totalDist = segments.reduce((s, seg) => s + seg.segmentDistance, 0)
  const totalTime = segments.reduce((s, seg) => s + seg.segmentTimeSecs, 0)
  return totalDist > 0 ? totalTime / totalDist : 0
}
