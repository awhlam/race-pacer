import type { PaceSegment, DistanceUnit } from '../types'
import { formatPace, formatTime, averagePace } from '../utils/paceCalculations'

interface Props {
  segments: PaceSegment[]
  unit: DistanceUnit
  onNoteChange: (index: number, note: string) => void
}

/** Interpolate a colour from green (#22c55e) to orange (#f97316) based on a 0–1 value. */
function paceColor(normalised: number): string {
  // 0 = fastest (green), 1 = slowest (orange/red)
  const r = Math.round(34 + (249 - 34) * normalised)
  const g = Math.round(197 + (115 - 197) * normalised)
  const b = Math.round(94 + (22 - 94) * normalised)
  return `rgb(${r},${g},${b})`
}

export default function PaceTable({ segments, unit, onNoteChange }: Props) {
  if (segments.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500">
        Configure your race details above to generate a pace plan.
      </div>
    )
  }

  const paces = segments.map((s) => s.paceSecsPerUnit)
  const minPace = Math.min(...paces)
  const maxPace = Math.max(...paces)
  const paceRange = maxPace - minPace || 1

  const avgPace = averagePace(segments)
  const totalTime = segments[segments.length - 1]?.cumulativeTimeSecs ?? 0
  const unitLabel = unit === 'km' ? 'km' : 'mi'

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden" id="pace-table">
      {/* Table header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Pace Plan
        </h2>
        <span className="text-xs text-gray-400">
          {segments.length} {segments.length === 1 ? 'segment' : 'segments'} · {formatTime(totalTime)}
        </span>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-750 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-semibold w-16">{unitLabel}</th>
              <th className="px-4 py-3 text-left font-semibold">Pace</th>
              <th className="px-4 py-3 text-left font-semibold">Seg. Time</th>
              <th className="px-4 py-3 text-left font-semibold">Cumulative</th>
              <th className="px-4 py-3 text-left font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg, i) => {
              const normalised =
                paceRange > 0 ? (seg.paceSecsPerUnit - minPace) / paceRange : 0
              const color = paceColor(normalised)
              const isPartial = seg.segmentDistance < 0.999
              const rowBg = i % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'

              return (
                <tr key={seg.segmentNum} className={`${rowBg} hover:bg-gray-700 transition-colors`}>
                  {/* Segment number */}
                  <td className="px-4 py-2.5 font-mono text-gray-300">
                    {isPartial ? (
                      <span className="text-xs text-gray-500">
                        {seg.segmentNum}
                        <span className="block text-gray-600">
                          ({seg.segmentDistance.toFixed(2)}{unitLabel})
                        </span>
                      </span>
                    ) : (
                      seg.segmentNum
                    )}
                  </td>

                  {/* Pace with colour pill */}
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block font-mono text-xs px-2 py-0.5 rounded font-semibold"
                      style={{ color, backgroundColor: `${color}22` }}
                    >
                      {formatPace(seg.paceSecsPerUnit)}/{unitLabel}
                    </span>
                  </td>

                  {/* Segment time */}
                  <td className="px-4 py-2.5 font-mono text-gray-300">
                    {formatTime(seg.segmentTimeSecs)}
                  </td>

                  {/* Cumulative time */}
                  <td className="px-4 py-2.5 font-mono text-white font-medium">
                    {formatTime(seg.cumulativeTimeSecs)}
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-2.5 min-w-[160px]">
                    <input
                      type="text"
                      className="note-input"
                      placeholder="Add note…"
                      value={seg.note}
                      onChange={(e) => onNoteChange(i, e.target.value)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Summary footer */}
          <tfoot>
            <tr className="bg-gray-900 border-t border-gray-700 text-green-400 font-semibold">
              <td className="px-4 py-3 text-xs uppercase tracking-wider text-gray-400">
                Total
              </td>
              <td className="px-4 py-3 font-mono text-sm">
                avg {formatPace(avgPace)}/{unitLabel}
              </td>
              <td className="px-4 py-3 font-mono text-sm">—</td>
              <td className="px-4 py-3 font-mono text-sm">
                {formatTime(totalTime)}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                Edit notes above
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
