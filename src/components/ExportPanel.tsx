import { useState } from 'react'
import type { PaceSegment, RaceConfig, ImageSize } from '../types'
import { downloadCSV, copyForGoogleSheets, exportAsImage } from '../utils/exportUtils'

interface Props {
  segments: PaceSegment[]
  config: RaceConfig
  tableElementId: string
}

const IMAGE_SIZES: { value: ImageSize; label: string; desc: string }[] = [
  { value: 'auto', label: 'Auto', desc: 'Fits content' },
  { value: 'wallpaper', label: 'Phone Wallpaper', desc: '1080 × 1920' },
  { value: 'letter', label: 'Letter Print', desc: '2550 × 3300' },
  { value: 'square', label: 'Square', desc: '1080 × 1080' },
]

export default function ExportPanel({ segments, config, tableElementId }: Props) {
  const [copiedSheets, setCopiedSheets] = useState(false)
  const [imageSize, setImageSize] = useState<ImageSize>('wallpaper')
  const [exportingImage, setExportingImage] = useState(false)

  const disabled = segments.length === 0

  async function handleCopySheets() {
    try {
      await copyForGoogleSheets(segments, config)
      setCopiedSheets(true)
      setTimeout(() => setCopiedSheets(false), 2000)
    } catch {
      alert('Could not access clipboard. Please check browser permissions.')
    }
  }

  async function handleImageExport() {
    setExportingImage(true)
    try {
      await exportAsImage(tableElementId, imageSize)
    } catch (e) {
      console.error(e)
      alert('Image export failed. Try a smaller size or a different browser.')
    } finally {
      setExportingImage(false)
    }
  }

  const btnBase =
    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
        Export
      </h2>

      <div className="flex flex-wrap gap-3 items-start">
        {/* CSV */}
        <button
          disabled={disabled}
          onClick={() => downloadCSV(segments, config)}
          className={`${btnBase} bg-gray-700 hover:bg-gray-600 text-gray-200`}
        >
          <DownloadIcon />
          Download CSV
        </button>

        {/* Google Sheets */}
        <button
          disabled={disabled}
          onClick={handleCopySheets}
          className={`${btnBase} ${
            copiedSheets
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
          }`}
        >
          {copiedSheets ? <CheckIcon /> : <SheetsIcon />}
          {copiedSheets ? 'Copied!' : 'Copy for Google Sheets'}
        </button>

        {/* Image export */}
        <div className="flex flex-col gap-1.5">
          {/* Size picker */}
          <div className="flex items-center gap-1">
            {IMAGE_SIZES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setImageSize(value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  imageSize === value
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
                title={desc}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export button */}
          <button
            disabled={disabled || exportingImage}
            onClick={handleImageExport}
            className={`${btnBase} bg-orange-500 hover:bg-orange-400 text-white`}
          >
            {exportingImage ? <SpinnerIcon /> : <ImageIcon />}
            {exportingImage ? 'Generating…' : 'Save as Image'}
          </button>

          {imageSize === 'wallpaper' && (
            <p className="text-xs text-gray-500">
              📱 Perfect for a lock-screen reference during your race
            </p>
          )}
        </div>
      </div>

      {copiedSheets && (
        <p className="text-xs text-green-400 mt-3">
          ✓ Copied! Open Google Sheets, click an empty cell, and press Ctrl+V (or ⌘V).
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2a1 1 0 00-1 1v7.586L6.707 8.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 10.586V3a1 1 0 00-1-1z" />
      <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function SheetsIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
      <path fillRule="evenodd" d="M7 9a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
