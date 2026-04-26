import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { PaceSegment, DistanceUnit } from '../types'
import { formatPace, averagePace } from '../utils/paceCalculations'

interface Props {
  segments: PaceSegment[]
  unit: DistanceUnit
}

interface ChartDatum {
  name: string
  pace: number
  label: string
}

/** Interpolate green → orange based on a 0–1 normalised pace value. */
function barColor(normalised: number): string {
  const r = Math.round(34 + (249 - 34) * normalised)
  const g = Math.round(197 + (115 - 197) * normalised)
  const b = Math.round(94 + (22 - 94) * normalised)
  return `rgb(${r},${g},${b})`
}

// Custom Y-axis tick renderer: seconds → "M:SS"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PaceTick(props: any) {
  const { x, y, payload } = props as { x: number; y: number; payload: { value: number } }
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#9ca3af" fontSize={11}>
      {formatPace(payload.value)}
    </text>
  )
}

// Custom tooltip
function PaceTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: ChartDatum }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-0.5">{d.payload.name}</p>
      <p className="text-white font-mono font-semibold">{formatPace(d.value)}/unit</p>
    </div>
  )
}

export default function PaceChart({ segments, unit }: Props) {
  if (segments.length === 0) return null

  const unitLabel = unit === 'km' ? 'km' : 'mi'

  const paces = segments.map((s) => s.paceSecsPerUnit)
  const minPace = Math.min(...paces)
  const maxPace = Math.max(...paces)
  const paceRange = maxPace - minPace || 1

  const data: ChartDatum[] = segments.map((seg) => ({
    name: `${unitLabel} ${seg.segmentNum}${seg.segmentDistance < 0.999 ? ` (${seg.segmentDistance.toFixed(2)})` : ''}`,
    pace: seg.paceSecsPerUnit,
    label: formatPace(seg.paceSecsPerUnit),
  }))

  const avg = averagePace(segments)

  // Y-axis domain: give a bit of breathing room
  const padding = (maxPace - minPace) * 0.25 || 30
  const yMin = Math.max(0, Math.floor(minPace - padding))
  const yMax = Math.ceil(maxPace + padding)

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Pace Chart
        </h2>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: barColor(0) }} />
            Fast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: barColor(1) }} />
            Slow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 border-t-2 border-dashed border-gray-400" />
            Avg
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#374151' }}
              interval={segments.length > 20 ? Math.floor(segments.length / 10) : 0}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={PaceTick}
              tickLine={false}
              axisLine={false}
              width={46}
              tickCount={6}
            />
            <Tooltip content={<PaceTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <ReferenceLine
              y={avg}
              stroke="#9ca3af"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `avg ${formatPace(avg)}`,
                fill: '#9ca3af',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <Bar dataKey="pace" radius={[3, 3, 0, 0]}>
              {data.map((_, i) => {
                const normalised = (paces[i] - minPace) / paceRange
                return <Cell key={i} fill={barColor(normalised)} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-600 text-center">
        Y-axis: pace per {unitLabel} (lower bar = faster)
      </p>
    </div>
  )
}
