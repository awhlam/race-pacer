import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RaceConfig } from '../types'
import {
  decodeConfig,
  encodeConfig,
  loadFromStorage,
  saveToStorage,
} from './configPersistence'

const SAMPLE: RaceConfig = {
  distanceKm: 42.195,
  targetPaceSecsPerUnit: 549,
  unit: 'miles',
  strategy: 'negative',
  spreadPercent: 3,
}

describe('encodeConfig / decodeConfig', () => {
  it('round-trips a complete config', () => {
    const encoded = encodeConfig(SAMPLE)
    expect(decodeConfig(encoded)).toEqual(SAMPLE)
  })

  it('rounds pace to whole seconds', () => {
    const encoded = encodeConfig({ ...SAMPLE, targetPaceSecsPerUnit: 549.7 })
    const decoded = decodeConfig(encoded)
    expect(decoded?.targetPaceSecsPerUnit).toBe(550)
  })

  it('strips a leading # from the input', () => {
    const encoded = encodeConfig(SAMPLE)
    expect(decodeConfig(`#${encoded}`)).toEqual(SAMPLE)
  })

  it('handles every strategy', () => {
    for (const strategy of ['even', 'negative', 'positive'] as const) {
      const encoded = encodeConfig({ ...SAMPLE, strategy })
      expect(decodeConfig(encoded)?.strategy).toBe(strategy)
    }
  })

  it('handles both units', () => {
    for (const unit of ['km', 'miles'] as const) {
      const encoded = encodeConfig({ ...SAMPLE, unit })
      expect(decodeConfig(encoded)?.unit).toBe(unit)
    }
  })

  it('returns null for empty input', () => {
    expect(decodeConfig('')).toBeNull()
    expect(decodeConfig('#')).toBeNull()
  })

  it('returns null when version is missing', () => {
    expect(decodeConfig('d=42&p=300&u=km&s=even&sp=0')).toBeNull()
  })

  it('returns null when version does not match', () => {
    expect(decodeConfig('v=99&d=42&p=300&u=km&s=even&sp=0')).toBeNull()
  })

  it('returns null when distance is invalid', () => {
    expect(decodeConfig('v=1&d=foo&p=300&u=km&s=even&sp=0')).toBeNull()
    expect(decodeConfig('v=1&d=0&p=300&u=km&s=even&sp=0')).toBeNull()
    expect(decodeConfig('v=1&d=-5&p=300&u=km&s=even&sp=0')).toBeNull()
    expect(decodeConfig('v=1&d=2000&p=300&u=km&s=even&sp=0')).toBeNull()
  })

  it('returns null when pace is invalid', () => {
    expect(decodeConfig('v=1&d=42&p=foo&u=km&s=even&sp=0')).toBeNull()
    expect(decodeConfig('v=1&d=42&p=0&u=km&s=even&sp=0')).toBeNull()
    expect(decodeConfig('v=1&d=42&p=99999&u=km&s=even&sp=0')).toBeNull()
  })

  it('returns null when unit is unrecognised', () => {
    expect(decodeConfig('v=1&d=42&p=300&u=furlongs&s=even&sp=0')).toBeNull()
  })

  it('returns null when strategy is unrecognised', () => {
    expect(decodeConfig('v=1&d=42&p=300&u=km&s=insane&sp=0')).toBeNull()
  })

  it('returns null when spread is out of range', () => {
    expect(decodeConfig('v=1&d=42&p=300&u=km&s=even&sp=-1')).toBeNull()
    expect(decodeConfig('v=1&d=42&p=300&u=km&s=even&sp=99')).toBeNull()
  })

  it('ignores unknown params (e.g. legacy `w` from pre-removal links)', () => {
    const decoded = decodeConfig('v=1&d=42&p=300&u=km&s=even&sp=0&w=1')
    expect(decoded).toEqual({
      distanceKm: 42,
      targetPaceSecsPerUnit: 300,
      unit: 'km',
      strategy: 'even',
      spreadPercent: 0,
    })
  })
})

describe('loadFromStorage / saveToStorage', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = new Map()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
      clear: () => store.clear(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips through storage', () => {
    saveToStorage(SAMPLE)
    expect(loadFromStorage()).toEqual(SAMPLE)
  })

  it('returns null when nothing has been stored', () => {
    expect(loadFromStorage()).toBeNull()
  })

  it('returns null when stored payload is corrupt', () => {
    store.set('race-pacer:config', 'not-a-real-payload')
    expect(loadFromStorage()).toBeNull()
  })

  it('does not throw when localStorage.getItem throws (private browsing)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
    })
    expect(() => loadFromStorage()).not.toThrow()
    expect(loadFromStorage()).toBeNull()
  })

  it('does not throw when localStorage.setItem throws (quota exceeded)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    })
    expect(() => saveToStorage(SAMPLE)).not.toThrow()
  })
})
