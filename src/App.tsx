import { useState, useCallback, useEffect } from 'react'
import type { RaceConfig } from './types'
import { PRESETS } from './types'
import { generateSegments } from './utils/paceCalculations'
import {
  decodeConfig,
  encodeConfig,
  loadFromStorage,
  saveToStorage,
} from './utils/configPersistence'
import RaceSetup from './components/RaceSetup'
import PaceTable from './components/PaceTable'
import PaceChart from './components/PaceChart'
import ExportPanel from './components/ExportPanel'

const DEFAULT_CONFIG: RaceConfig = {
  distanceKm: PRESETS['Marathon'],
  targetPaceSecsPerUnit: 9 * 60 + 9, // 9:09/mile ≈ 4h marathon
  unit: 'miles',
  strategy: 'negative',
  spreadPercent: 3,
}

const TABLE_ID = 'pace-table'

function initialConfig(): RaceConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  return (
    decodeConfig(window.location.hash) ??
    loadFromStorage() ??
    DEFAULT_CONFIG
  )
}

export default function App() {
  const [config, setConfig] = useState<RaceConfig>(initialConfig)
  const [notes, setNotes] = useState<string[]>([])

  useEffect(() => {
    const encoded = encodeConfig(config)
    window.history.replaceState(null, '', `#${encoded}`)
    saveToStorage(config)
  }, [config])

  const segments = generateSegments(config, notes)

  const handleNoteChange = useCallback((index: number, note: string) => {
    setNotes((prev) => {
      const next = [...prev]
      next[index] = note
      return next
    })
  }, [])

  // Reset notes when segment count changes (different race distance)
  const prevSegmentCount = segments.length
  const handleConfigChange = useCallback(
    (newConfig: RaceConfig) => {
      setConfig(newConfig)
      // If segment count would change, trim or reset notes
      const newSegments = generateSegments(newConfig, notes)
      if (newSegments.length !== prevSegmentCount) {
        setNotes((prev) => prev.slice(0, newSegments.length))
      }
    },
    [notes, prevSegmentCount],
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top nav */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏃</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Race Pacer</h1>
              <p className="text-xs text-gray-400 leading-tight">
                Plan your splits. Crush your race.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span>Open-source · Client-side only</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Top row: setup + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <RaceSetup config={config} onChange={handleConfigChange} />
          <PaceChart segments={segments} unit={config.unit} />
        </div>

        {/* Pace table */}
        <PaceTable
          segments={segments}
          unit={config.unit}
          onNoteChange={handleNoteChange}
        />

        {/* Export panel */}
        <ExportPanel
          segments={segments}
          config={config}
          tableElementId={TABLE_ID}
        />

        {/* Footer */}
        <footer className="text-center text-xs text-gray-700 pb-4">
          Race Pacer · All calculations run in your browser · Your plan is saved locally and never sent anywhere
        </footer>
      </main>
    </div>
  )
}
