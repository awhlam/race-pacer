import type { PaceSegment, RaceConfig, ImageSize } from '../types'
import { formatPace, formatTime } from './paceCalculations'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function unitLabel(config: RaceConfig): string {
  return config.unit === 'km' ? 'km' : 'mi'
}

function buildRows(segments: PaceSegment[], config: RaceConfig): string[][] {
  return segments.map((seg) => [
    seg.segmentDistance < 0.999
      ? `${unitLabel(config)} ${seg.segmentNum} (${seg.segmentDistance.toFixed(2)} ${unitLabel(config)})`
      : `${unitLabel(config)} ${seg.segmentNum}`,
    `${formatPace(seg.paceSecsPerUnit)}/${unitLabel(config)}`,
    formatTime(seg.segmentTimeSecs),
    formatTime(seg.cumulativeTimeSecs),
    seg.note,
  ])
}

// ---------------------------------------------------------------------------
// CSV download
// ---------------------------------------------------------------------------

export function downloadCSV(segments: PaceSegment[], config: RaceConfig): void {
  const headers = ['Segment', `Pace (/${unitLabel(config)})`, 'Segment Time', 'Cumulative Time', 'Notes']
  const rows = buildRows(segments, config)

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          // Escape double-quotes and wrap in quotes if the cell contains a
          // comma, double-quote, or newline.
          const escaped = cell.replace(/"/g, '""')
          return /[,"\n]/.test(cell) ? `"${escaped}"` : escaped
        })
        .join(','),
    )
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'race-pace-plan.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Google Sheets clipboard copy (TSV)
// ---------------------------------------------------------------------------

export async function copyForGoogleSheets(
  segments: PaceSegment[],
  config: RaceConfig,
): Promise<void> {
  const headers = ['Segment', `Pace (/${unitLabel(config)})`, 'Segment Time', 'Cumulative Time', 'Notes']
  const rows = buildRows(segments, config)

  const tsv = [headers, ...rows].map((row) => row.join('\t')).join('\n')
  await navigator.clipboard.writeText(tsv)
}

// ---------------------------------------------------------------------------
// Image export via html2canvas
// ---------------------------------------------------------------------------

const IMAGE_SIZES: Record<Exclude<ImageSize, 'auto'>, { width: number; height: number }> = {
  wallpaper: { width: 1080, height: 1920 },
  letter: { width: 2550, height: 3300 },
  square: { width: 1080, height: 1080 },
}

export async function exportAsImage(
  elementId: string,
  size: ImageSize,
): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error(`Element #${elementId} not found`)

  // Dynamically import html2canvas to keep initial bundle lean
  const html2canvas = (await import('html2canvas')).default

  // Blank out placeholder text so empty note fields don't appear in the export
  const noteInputs = Array.from(element.querySelectorAll<HTMLInputElement>('.note-input'))
  const savedPlaceholders = noteInputs.map((el) => el.placeholder)
  noteInputs.forEach((el) => { el.placeholder = '' })

  try {
    if (size === 'auto') {
      const canvas = await html2canvas(element, {
        backgroundColor: '#111827', // gray-900
        scale: 2,
        useCORS: true,
        logging: false,
      })
      triggerDownload(canvas, 'race-pace-plan.png')
      return
    }

    const { width, height } = IMAGE_SIZES[size]

    // Render the element at 2× device-pixel-ratio for sharpness
    const sourceCanvas = await html2canvas(element, {
      backgroundColor: '#111827',
      scale: 2,
      useCORS: true,
      logging: false,
    })

    // Compose onto a canvas of the target pixel dimensions
    const output = document.createElement('canvas')
    output.width = width
    output.height = height
    const ctx = output.getContext('2d')!
    ctx.fillStyle = '#111827'
    ctx.fillRect(0, 0, width, height)

    // Scale source to fit within the target, maintaining aspect ratio, centered
    const scaleX = width / sourceCanvas.width
    const scaleY = height / sourceCanvas.height
    const scale = Math.min(scaleX, scaleY, 1) // never upscale past 1:1

    const drawW = sourceCanvas.width * scale
    const drawH = sourceCanvas.height * scale
    const offsetX = (width - drawW) / 2
    const offsetY = (height - drawH) / 2

    ctx.drawImage(sourceCanvas, offsetX, offsetY, drawW, drawH)

    triggerDownload(output, `race-pace-${size}.png`)
  } finally {
    noteInputs.forEach((el, i) => { el.placeholder = savedPlaceholders[i] })
  }
}

function triggerDownload(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
