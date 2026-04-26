import { describe, it, expect } from 'vitest'
import type { PacingStrategy, RaceConfig } from '../types'
import { PRESETS } from '../types'
import {
  averagePace,
  formatHourMin,
  formatPace,
  formatTime,
  generateSegments,
  parsePaceInput,
  parseTimeInput,
} from './paceCalculations'

const STRATEGIES: PacingStrategy[] = ['even', 'negative', 'positive']

function cfg(overrides: Partial<RaceConfig> = {}): RaceConfig {
  return {
    distanceKm: PRESETS.Marathon,
    targetPaceSecsPerUnit: 300,
    unit: 'km',
    strategy: 'even',
    spreadPercent: 0,
    ...overrides,
  }
}

describe('formatPace', () => {
  it('formats whole minutes', () => {
    expect(formatPace(300)).toBe('5:00')
  })
  it('zero-pads seconds', () => {
    expect(formatPace(305)).toBe('5:05')
  })
  it('rounds sub-second values', () => {
    expect(formatPace(299.6)).toBe('5:00')
  })
})

describe('formatTime', () => {
  it('omits hours when zero', () => {
    expect(formatTime(125)).toBe('2:05')
  })
  it('includes hours when present', () => {
    expect(formatTime(3725)).toBe('1:02:05')
  })
  it('rolls seconds over to minutes when rounding up', () => {
    expect(formatTime(3599.6)).toBe('1:00:00')
  })
})

describe('formatHourMin', () => {
  it('formats target time as H:MM', () => {
    expect(formatHourMin(4 * 3600 + 5 * 60)).toBe('4:05')
  })
  it('rolls minutes over to hours when rounding up', () => {
    expect(formatHourMin(3599)).toBe('1:00')
  })
})

describe('parsePaceInput', () => {
  it('parses valid M:SS', () => {
    expect(parsePaceInput('4:30')).toBe(270)
  })
  it('rejects out-of-range seconds', () => {
    expect(parsePaceInput('4:60')).toBeNaN()
  })
  it('rejects garbage', () => {
    expect(parsePaceInput('abc')).toBeNaN()
  })
})

describe('parseTimeInput', () => {
  it('parses valid H:MM', () => {
    expect(parseTimeInput('3:45')).toBe(3 * 3600 + 45 * 60)
  })
  it('rejects out-of-range minutes', () => {
    expect(parseTimeInput('3:60')).toBeNaN()
  })
})

describe('generateSegments — segment count and structure', () => {
  it('produces N full segments for an integer distance', () => {
    const segs = generateSegments(cfg({ distanceKm: 10, unit: 'km' }), [])
    expect(segs).toHaveLength(10)
    expect(segs[0].segmentDistance).toBe(1)
    expect(segs[9].segmentDistance).toBe(1)
  })

  it('adds a partial trailing segment for fractional distance', () => {
    const segs = generateSegments(
      cfg({ distanceKm: PRESETS.Marathon, unit: 'miles' }),
      [],
    )
    expect(segs).toHaveLength(27) // 26 mile splits + partial
    expect(segs[26].segmentDistance).toBeCloseTo(0.2188, 3)
  })

  it('attaches notes positionally', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 5, unit: 'km' }),
      ['gel', '', 'water'],
    )
    expect(segs[0].note).toBe('gel')
    expect(segs[2].note).toBe('water')
    expect(segs[4].note).toBe('')
  })

  it('cumulative time is monotonically increasing', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 21.0975, unit: 'km', strategy: 'positive', spreadPercent: 5 }),
      [],
    )
    for (let i = 1; i < segs.length; i++) {
      expect(segs[i].cumulativeTimeSecs).toBeGreaterThan(segs[i - 1].cumulativeTimeSecs)
    }
  })
})

describe('generateSegments — goal-time invariant', () => {
  // Tolerance: the partial-tail inheriting the closing pace introduces a
  // small error proportional to remainder × P × S/2. For the worst case
  // (marathon-in-miles, S=0.08, P≈482 s/mi, remainder≈0.22), this is ~4 s.
  const TOLERANCE_S = 5

  for (const distanceKm of [5, 10, 21.0975, 42.195]) {
    for (const unit of ['km', 'miles'] as const) {
      for (const strategy of STRATEGIES) {
        for (const spreadPercent of [0, 3, 8]) {
          it(`${distanceKm}km in ${unit}, ${strategy}, spread=${spreadPercent}`, () => {
            const segs = generateSegments(
              cfg({ distanceKm, unit, strategy, spreadPercent }),
              [],
            )
            const total = segs[segs.length - 1].cumulativeTimeSecs
            const expectedDist = unit === 'km' ? distanceKm : distanceKm / 1.60934
            const expected = 300 * expectedDist
            expect(Math.abs(total - expected)).toBeLessThan(TOLERANCE_S)
          })
        }
      }
    }
  }
})

describe('generateSegments — strategy shapes', () => {
  it('even returns identical pace for every full segment', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 10, unit: 'km', strategy: 'even', spreadPercent: 8 }),
      [],
    )
    for (const s of segs) {
      expect(s.paceSecsPerUnit).toBe(300)
    }
  })

  it('negative split is monotonically decreasing across full segments (no midpoint cliff)', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 10, unit: 'km', strategy: 'negative', spreadPercent: 6 }),
      [],
    )
    for (let i = 1; i < 10; i++) {
      expect(segs[i].paceSecsPerUnit).toBeLessThan(segs[i - 1].paceSecsPerUnit)
    }
  })

  it('positive split is monotonically increasing across full segments', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 10, unit: 'km', strategy: 'positive', spreadPercent: 6 }),
      [],
    )
    for (let i = 1; i < 10; i++) {
      expect(segs[i].paceSecsPerUnit).toBeGreaterThan(segs[i - 1].paceSecsPerUnit)
    }
  })

  it('endpoint paces are symmetric around target', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 10, unit: 'km', strategy: 'negative', spreadPercent: 6 }),
      [],
    )
    const first = segs[0].paceSecsPerUnit
    const last = segs[9].paceSecsPerUnit
    expect((first + last) / 2).toBeCloseTo(300, 6)
  })
})

describe('generateSegments — partial segment inheritance', () => {
  it('partial segment inherits the closing pace, not the average', () => {
    const segs = generateSegments(
      cfg({
        distanceKm: PRESETS.Marathon,
        unit: 'miles',
        strategy: 'negative',
        spreadPercent: 6,
      }),
      [],
    )
    const lastFull = segs[25].paceSecsPerUnit
    const partial = segs[26].paceSecsPerUnit
    expect(partial).toBe(lastFull)
  })
})

describe('averagePace', () => {
  it('returns 0 for empty input', () => {
    expect(averagePace([])).toBe(0)
  })

  it('weights by segment distance', () => {
    const segs = generateSegments(
      cfg({ distanceKm: 10, unit: 'km', strategy: 'even' }),
      [],
    )
    expect(averagePace(segs)).toBeCloseTo(300, 6)
  })
})
