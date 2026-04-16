import { useState, useCallback } from 'react'
import type { RaceConfig, PacingStrategy, DistanceUnit } from '../types'
import { PRESETS, KM_PER_MILE } from '../types'
import { parsePaceInput, formatPace } from '../utils/paceCalculations'

interface Props {
  config: RaceConfig
  onChange: (config: RaceConfig) => void
}

const STRATEGIES: { value: PacingStrategy; label: string; description: string }[] = [
  { value: 'even', label: 'Even Split', description: 'Same pace throughout' },
  { value: 'negative', label: 'Negative Split', description: '2nd half faster' },
  { value: 'positive', label: 'Positive Split', description: '1st half faster' },
  { value: 'progressive', label: 'Progressive', description: 'Steadily accelerate' },
]

export default function RaceSetup({ config, onChange }: Props) {
  // Track which preset button is active (null = custom)
  const [activePreset, setActivePreset] = useState<string | null>('Marathon')
  // Local text value for the pace input so partial typing works
  const [paceInput, setPaceInput] = useState<string>(
    formatPace(config.targetPaceSecsPerUnit),
  )
  const [customDistance, setCustomDistance] = useState<string>('')

  const update = useCallback(
    (partial: Partial<RaceConfig>) => onChange({ ...config, ...partial }),
    [config, onChange],
  )

  function handlePreset(name: string, km: number) {
    setActivePreset(name)
    setCustomDistance('')
    update({ distanceKm: km })
  }

  function handleCustomDistance(value: string) {
    setCustomDistance(value)
    setActivePreset(null)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      const km = config.unit === 'km' ? num : num * KM_PER_MILE
      update({ distanceKm: km })
    }
  }

  function handleUnitToggle(unit: DistanceUnit) {
    // Convert the displayed pace to the new unit
    const newPace =
      unit === 'km'
        ? config.targetPaceSecsPerUnit / KM_PER_MILE
        : config.targetPaceSecsPerUnit * KM_PER_MILE
    setPaceInput(formatPace(newPace))
    update({ unit, targetPaceSecsPerUnit: newPace })
  }

  function handlePaceChange(value: string) {
    setPaceInput(value)
    const secs = parsePaceInput(value)
    if (!isNaN(secs) && secs > 0) {
      update({ targetPaceSecsPerUnit: secs })
    }
  }

  function handlePaceBlur() {
    // Reformat on blur if valid
    const secs = parsePaceInput(paceInput)
    if (!isNaN(secs) && secs > 0) {
      setPaceInput(formatPace(secs))
    }
  }

  const displayDistance =
    config.unit === 'km'
      ? config.distanceKm.toFixed(config.distanceKm % 1 === 0 ? 0 : 3)
      : (config.distanceKm / KM_PER_MILE).toFixed(
          (config.distanceKm / KM_PER_MILE) % 1 === 0 ? 0 : 2,
        )

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏃</span>
        <h2 className="text-lg font-bold text-white">Race Setup</h2>
      </div>

      {/* Distance unit toggle */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Distance Unit
        </label>
        <div className="flex bg-gray-700 rounded-lg p-1 w-fit">
          {(['km', 'miles'] as DistanceUnit[]).map((u) => (
            <button
              key={u}
              onClick={() => handleUnitToggle(u)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                config.unit === u
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {u === 'km' ? 'km' : 'Miles'}
            </button>
          ))}
        </div>
      </div>

      {/* Distance presets */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Distance
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(PRESETS).map(([name, km]) => (
            <button
              key={name}
              onClick={() => handlePreset(name, km)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activePreset === name
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.1"
            step="0.1"
            placeholder={`Custom (${config.unit})`}
            value={customDistance}
            onChange={(e) => handleCustomDistance(e.target.value)}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
          />
          <span className="text-gray-400 text-sm">{config.unit}</span>
        </div>
        {activePreset === null && !customDistance && (
          <span className="text-xs text-gray-500 mt-1 block">
            Currently: {displayDistance} {config.unit}
          </span>
        )}
      </div>

      {/* Target pace */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Target Average Pace
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="5:30"
            value={paceInput}
            onChange={(e) => handlePaceChange(e.target.value)}
            onBlur={handlePaceBlur}
            className="w-28 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500 font-mono"
          />
          <span className="text-gray-400 text-sm">min/{config.unit}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Format: M:SS (e.g. 5:30)</p>
      </div>

      {/* Pacing strategy */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Pacing Strategy
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STRATEGIES.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => update({ strategy: value })}
              className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                config.strategy === value
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white'
              }`}
            >
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Spread slider (hidden for even split) */}
      {config.strategy !== 'even' && (
        <div>
          <label className="flex justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            <span>Variance</span>
            <span className="text-orange-400">{config.spreadPercent}%</span>
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={config.spreadPercent}
            onChange={(e) => update({ spreadPercent: Number(e.target.value) })}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1% (subtle)</span>
            <span>30% (aggressive)</span>
          </div>
        </div>
      )}
    </div>
  )
}
