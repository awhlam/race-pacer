export type PacingStrategy = 'even' | 'negative' | 'positive'
export type DistanceUnit = 'km' | 'miles'
export type ImageSize = 'auto' | 'wallpaper' | 'letter' | 'square'

export interface RaceConfig {
  /** Total race distance, always stored in kilometres internally */
  distanceKm: number
  /** Target average pace in seconds per unit (km or mile) */
  targetPaceSecsPerUnit: number
  unit: DistanceUnit
  strategy: PacingStrategy
  /** 0–8: how much variance to apply across segments, as a percentage */
  spreadPercent: number
}

export interface PaceSegment {
  segmentNum: number
  /** Fractional distance covered by this segment (e.g. 1.0 for full, 0.2 for final partial) */
  segmentDistance: number
  /** Pace for this specific segment in seconds per unit */
  paceSecsPerUnit: number
  /** Duration of this segment in seconds */
  segmentTimeSecs: number
  /** Running total time in seconds up to end of this segment */
  cumulativeTimeSecs: number
  note: string
}

export const PRESETS: Record<string, number> = {
  '5K': 5,
  '10K': 10,
  'Half Marathon': 21.0975,
  'Marathon': 42.195,
}

export const KM_PER_MILE = 1.60934
