import { useState } from 'react'
import type { RaceConfig, PacingStrategy, DistanceUnit } from '../types'
import { PRESETS, KM_PER_MILE } from '../types'
import { parsePaceInput, formatPace, parseTimeInput, formatHourMin } from '../utils/paceCalculations'

interface Props {
  config: RaceConfig
  onChange: (config: RaceConfig) => void
}

const STRATEGIES: { value: PacingStrategy; label: string; description: string }[] = [
  { value: 'even', label: 'Even Split', description: 'Steady pace — best for 5K' },
  { value: 'negative', label: 'Negative Split', description: 'Gradually speed up — ideal for half/full marathon' },
  { value: 'positive', label: 'Positive Split', description: 'Gradually slow down — honest effort' },
]

function suggestedStrategyForPreset(name: string): PacingStrategy {
  return name === '5K' ? 'even' : 'negative'
}

export default function RaceSetup({ config, onChange }: Props) {
  const [activePreset, setActivePreset] = useState<string>('Marathon')
  const [customDistance, setCustomDistance] = useState<string>('')
  const [lastEdited, setLastEdited] = useState<'pace' | 'time'>('pace')

  // Both inputs are initialized from config on first render
  const initDist = config.unit === 'km' ? config.distanceKm : config.distanceKm / KM_PER_MILE
  const initTimeSecs = Math.round(config.targetPaceSecsPerUnit * initDist)
  const [paceInput, setPaceInput] = useState(formatPace(config.targetPaceSecsPerUnit))
  const [timeInput, setTimeInput] = useState(formatHourMin(initTimeSecs))
  const [targetTimeSecs, setTargetTimeSecs] = useState(initTimeSecs)

  const update = (partial: Partial<RaceConfig>) => onChange({ ...config, ...partial })

  function distInUnits(km: number, unit: DistanceUnit): number {
    return unit === 'km' ? km : km / KM_PER_MILE
  }

  function handlePreset(name: string, km: number) {
    setActivePreset(name)
    setCustomDistance('')
    const strategy = suggestedStrategyForPreset(name)
    if (lastEdited === 'time' && targetTimeSecs > 0) {
      const dist = distInUnits(km, config.unit)
      const newPace = targetTimeSecs / dist
      setPaceInput(formatPace(newPace))
      update({ distanceKm: km, targetPaceSecsPerUnit: newPace, strategy })
    } else {
      const dist = distInUnits(km, config.unit)
      const newTimeSecs = Math.round(config.targetPaceSecsPerUnit * dist)
      setTargetTimeSecs(newTimeSecs)
      setTimeInput(formatHourMin(newTimeSecs))
      update({ distanceKm: km, strategy })
    }
  }

  function handleCustomClick() {
    setActivePreset('custom')
    setCustomDistance('')
  }

  function handleCustomDistance(value: string) {
    setCustomDistance(value)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      const km = config.unit === 'km' ? num : num * KM_PER_MILE
      if (lastEdited === 'time' && targetTimeSecs > 0) {
        const newPace = targetTimeSecs / num // num is already in display units
        setPaceInput(formatPace(newPace))
        update({ distanceKm: km, targetPaceSecsPerUnit: newPace })
      } else {
        const newTimeSecs = Math.round(config.targetPaceSecsPerUnit * num)
        setTargetTimeSecs(newTimeSecs)
        setTimeInput(formatHourMin(newTimeSecs))
        update({ distanceKm: km })
      }
    }
  }

  function handleUnitToggle(unit: DistanceUnit) {
    if (lastEdited === 'time' && targetTimeSecs > 0) {
      const dist = distInUnits(config.distanceKm, unit)
      const newPace = targetTimeSecs / dist
      setPaceInput(formatPace(newPace))
      update({ unit, targetPaceSecsPerUnit: newPace })
    } else {
      const newPace =
        unit === 'km'
          ? config.targetPaceSecsPerUnit / KM_PER_MILE
          : config.targetPaceSecsPerUnit * KM_PER_MILE
      const dist = distInUnits(config.distanceKm, unit)
      const newTimeSecs = Math.round(newPace * dist)
      setPaceInput(formatPace(newPace))
      setTargetTimeSecs(newTimeSecs)
      setTimeInput(formatHourMin(newTimeSecs))
      update({ unit, targetPaceSecsPerUnit: newPace })
    }
  }

  function handlePaceChange(value: string) {
    setPaceInput(value)
    const secs = parsePaceInput(value)
    if (!isNaN(secs) && secs > 0) {
      setLastEdited('pace')
      const dist = distInUnits(config.distanceKm, config.unit)
      const newTimeSecs = Math.round(secs * dist)
      setTargetTimeSecs(newTimeSecs)
      setTimeInput(formatHourMin(newTimeSecs))
      update({ targetPaceSecsPerUnit: secs })
    }
  }

  function handlePaceBlur() {
    const secs = parsePaceInput(paceInput)
    if (!isNaN(secs) && secs > 0) {
      setPaceInput(formatPace(secs))
    }
  }

  function handleTimeChange(value: string) {
    setTimeInput(value)
    const secs = parseTimeInput(value)
    if (!isNaN(secs) && secs > 0) {
      setLastEdited('time')
      setTargetTimeSecs(secs)
      const dist = distInUnits(config.distanceKm, config.unit)
      const newPace = secs / dist
      setPaceInput(formatPace(newPace))
      update({ targetPaceSecsPerUnit: newPace })
    }
  }

  function handleTimeBlur() {
    if (targetTimeSecs > 0) {
      setTimeInput(formatHourMin(targetTimeSecs))
    }
  }

  const displayDist = (() => {
    const d = config.unit === 'km' ? config.distanceKm : config.distanceKm / KM_PER_MILE
    return d % 1 === 0 ? d.toFixed(0) : d.toFixed(1)
  })()

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-5">
      {/* Header with distance */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏃</span>
        <div>
          <h2 className="text-lg font-bold text-white leading-tight">Race Setup</h2>
          <p className="text-base font-semibold text-orange-400 leading-tight">
            {displayDist} {config.unit}
          </p>
        </div>
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

      {/* Distance presets + custom */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Distance
        </label>
        <div className="flex flex-wrap gap-2">
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
          <button
            onClick={handleCustomClick}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activePreset === 'custom'
                ? 'bg-orange-500 border-orange-500 text-white'
                : 'border-gray-600 text-gray-300 hover:border-orange-400 hover:text-orange-300'
            }`}
          >
            Custom
          </button>
        </div>
        {activePreset === 'custom' && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              autoFocus
              min="0.1"
              step="0.1"
              placeholder={`Distance in ${config.unit}`}
              value={customDistance}
              onChange={(e) => handleCustomDistance(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
            />
            <span className="text-gray-400 text-sm">{config.unit}</span>
          </div>
        )}
      </div>

      {/* Target: pace + time (both always visible, linked) */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Target
        </label>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Pace</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="9:00"
                value={paceInput}
                onChange={(e) => handlePaceChange(e.target.value)}
                onBlur={handlePaceBlur}
                className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500 font-mono"
              />
              <span className="text-gray-400 text-sm">min/{config.unit}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Goal Time</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="3:45"
                value={timeInput}
                onChange={(e) => handleTimeChange(e.target.value)}
                onBlur={handleTimeBlur}
                className="w-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500 font-mono"
              />
              <span className="text-gray-400 text-sm">h:mm</span>
            </div>
          </div>
        </div>
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
            max={8}
            value={config.spreadPercent}
            onChange={(e) => update({ spreadPercent: Number(e.target.value) })}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>1% (subtle)</span>
            <span>8% (aggressive)</span>
          </div>
        </div>
      )}

    </div>
  )
}
