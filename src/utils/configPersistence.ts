import type { DistanceUnit, PacingStrategy, RaceConfig } from '../types'

const HASH_VERSION = '1'
const STORAGE_KEY = 'race-pacer:config'

export function encodeConfig(config: RaceConfig): string {
  const params = new URLSearchParams({
    v: HASH_VERSION,
    d: String(config.distanceKm),
    p: String(Math.round(config.targetPaceSecsPerUnit)),
    u: config.unit,
    s: config.strategy,
    sp: String(config.spreadPercent),
    w: config.warmup ? '1' : '0',
  })
  return params.toString()
}

export function decodeConfig(encoded: string): RaceConfig | null {
  const clean = encoded.startsWith('#') ? encoded.slice(1) : encoded
  if (!clean) return null
  const params = new URLSearchParams(clean)
  if (params.get('v') !== HASH_VERSION) return null

  const d = parseFloat(params.get('d') ?? '')
  const p = parseFloat(params.get('p') ?? '')
  const u = params.get('u')
  const s = params.get('s')
  const sp = parseFloat(params.get('sp') ?? '')
  const w = params.get('w')

  if (!isFinite(d) || d <= 0 || d > 1000) return null
  if (!isFinite(p) || p <= 0 || p > 7200) return null
  if (u !== 'km' && u !== 'miles') return null
  if (s !== 'even' && s !== 'negative' && s !== 'positive') return null
  if (!isFinite(sp) || sp < 0 || sp > 8) return null
  if (w !== '0' && w !== '1') return null

  return {
    distanceKm: d,
    targetPaceSecsPerUnit: p,
    unit: u as DistanceUnit,
    strategy: s as PacingStrategy,
    spreadPercent: sp,
    warmup: w === '1',
  }
}

export function loadFromStorage(): RaceConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? decodeConfig(raw) : null
  } catch {
    return null
  }
}

export function saveToStorage(config: RaceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, encodeConfig(config))
  } catch {
    // Quota / private browsing — silently ignore
  }
}
