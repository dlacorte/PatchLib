'use client'

import { useState, useCallback } from 'react'
import { DFAM_PATCH_POINTS, CABLE_COLORS, type PatchPointDef } from '@/lib/dfam'

interface Connection {
  fromJack: string
  toJack: string
  color: string
}

interface PatchBayProps {
  connections: Connection[]
  onChange: (connections: Connection[]) => void
}

const OUT_IDS = new Set(DFAM_PATCH_POINTS.filter(p => p.direction === 'out').map(p => p.id))

function colorHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

// Sort patch points by row then col for linear grid rendering
const SORTED_POINTS = [...DFAM_PATCH_POINTS].sort(
  (a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col
)

export function PatchBay({ connections, onChange }: PatchBayProps) {
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('orange')
  const [selectedCable, setSelectedCable] = useState<number | null>(null)

  const handleJackClick = useCallback(
    (point: PatchPointDef) => {
      setSelectedCable(null)
      if (OUT_IDS.has(point.id)) {
        setPendingFrom(prev => (prev === point.id ? null : point.id))
      } else {
        if (!pendingFrom) return
        const exists = connections.some(c => c.fromJack === pendingFrom && c.toJack === point.id)
        if (!exists) {
          onChange([...connections, { fromJack: pendingFrom, toJack: point.id, color: selectedColor }])
        }
        setPendingFrom(null)
      }
    },
    [pendingFrom, selectedColor, connections, onChange],
  )

  const deleteSelectedCable = useCallback(() => {
    if (selectedCable === null) return
    onChange(connections.filter((_, i) => i !== selectedCable))
    setSelectedCable(null)
  }, [selectedCable, connections, onChange])

  const isTargeting = !!pendingFrom

  return (
    <div className="space-y-3">

      {/* Cable color picker */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Cable:</span>
        <div className="flex gap-1.5">
          {CABLE_COLORS.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedColor(c.id)}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                selectedColor === c.id ? 'border-white scale-125' : 'border-transparent opacity-60'
              }`}
              style={{ backgroundColor: c.hex }}
              aria-label={`${c.label} cable`}
            />
          ))}
        </div>
      </div>

      {/* 8×3 patchbay grid */}
      <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-2">
        <div className="grid grid-cols-3 gap-1">
          {SORTED_POINTS.map(point => {
            const isOut = OUT_IDS.has(point.id)
            const isPending = pendingFrom === point.id
            const isConnected = isOut
              ? connections.some(c => c.fromJack === point.id)
              : connections.some(c => c.toJack === point.id)
            const connColor = isOut
              ? connections.find(c => c.fromJack === point.id)?.color
              : connections.find(c => c.toJack === point.id)?.color
            const isClickable = isOut || (isTargeting && !isOut)

            return (
              <button
                key={point.id}
                type="button"
                data-testid={`jack-${point.id}`}
                onClick={() => handleJackClick(point)}
                className={`
                  relative flex flex-col items-center justify-center py-2 px-1 rounded text-center
                  border transition-all select-none
                  ${isPending
                    ? 'border-orange-500 bg-orange-950/30'
                    : isTargeting && !isOut
                    ? 'border-zinc-600 bg-zinc-900/50 hover:border-zinc-400 cursor-crosshair'
                    : isConnected
                    ? 'border-zinc-600 bg-zinc-900/30'
                    : 'border-zinc-800 bg-zinc-900/20'
                  }
                  ${isClickable ? 'cursor-pointer hover:border-zinc-600' : 'cursor-default'}
                `}
              >
                {/* Connection color dot */}
                {(isConnected || isPending) && connColor && (
                  <span
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isPending ? colorHex(selectedColor) : colorHex(connColor) }}
                  />
                )}
                {isPending && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
                <span className={`text-[8px] font-mono font-bold uppercase leading-tight ${
                  isOut ? 'text-orange-400/80' : 'text-zinc-400'
                }`}>
                  {point.label}
                </span>
                <span className={`text-[7px] font-mono mt-0.5 ${isOut ? 'text-orange-600/70' : 'text-zinc-600'}`}>
                  {isOut ? '▲ out' : 'in ▼'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Status */}
      <div className="min-h-[20px]">
        {pendingFrom && (
          <p className="text-[10px] text-orange-400 font-mono">
            Click an input to complete — or click the same output to cancel
          </p>
        )}
        {selectedCable !== null && (
          <button
            type="button"
            onClick={deleteSelectedCable}
            className="text-[10px] text-red-400 border border-red-900/50 rounded px-2 py-0.5 hover:bg-red-950/50 transition-colors font-mono"
          >
            Remove cable
          </button>
        )}
      </div>

      {/* Cable list */}
      {connections.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Cables</div>
          {connections.map((conn, i) => {
            const from = DFAM_PATCH_POINTS.find(p => p.id === conn.fromJack)
            const to = DFAM_PATCH_POINTS.find(p => p.id === conn.toJack)
            return (
              <button
                key={i}
                type="button"
                data-cable
                onClick={() => {
                  setPendingFrom(null)
                  setSelectedCable(prev => (prev === i ? null : i))
                }}
                className={`w-full flex items-center gap-2 text-[10px] font-mono text-left px-2 py-1 rounded border transition-colors ${
                  selectedCable === i
                    ? 'border-red-900/60 bg-red-950/20 text-red-400'
                    : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex(conn.color) }} />
                <span className="text-orange-400/70">{from?.label ?? conn.fromJack}</span>
                <span className="text-zinc-700">→</span>
                <span className="text-zinc-400">{to?.label ?? conn.toJack}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
