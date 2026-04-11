'use client'

import { useState, useCallback, useMemo } from 'react'
import { CABLE_COLORS, type PatchPointDef } from '@/lib/dfam'
import { prefixJackId } from '@/lib/devices'
import type { ConnectionFormValue } from '@/lib/types'

export interface DevicePoints {
  deviceId: string
  deviceLabel: string
  points: PatchPointDef[]
}

interface PatchBayProps {
  devicePoints: DevicePoints[]
  connections: ConnectionFormValue[]
  onChange: (connections: ConnectionFormValue[]) => void
  selectedColor?: string
}

function colorHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

export function PatchBay({ devicePoints, connections, onChange, selectedColor: externalColor }: PatchBayProps) {
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  const [internalColor, setInternalColor] = useState('orange')
  const [selectedCable, setSelectedCable] = useState<number | null>(null)

  const selectedColor = externalColor ?? internalColor

  // Build set of all output jack prefixed IDs
  const outIds = useMemo(
    () =>
      new Set(
        devicePoints.flatMap(dp =>
          dp.points.filter(p => p.direction === 'out').map(p => prefixJackId(dp.deviceId, p.id))
        )
      ),
    [devicePoints],
  )

  // Find the label for a prefixed jack ID across all devices
  const findLabel = useCallback(
    (prefixedId: string) => {
      const colon = prefixedId.indexOf(':')
      if (colon === -1) return prefixedId
      const devId = prefixedId.slice(0, colon).toUpperCase()
      const jackId = prefixedId.slice(colon + 1)
      const dp = devicePoints.find(d => d.deviceId === devId)
      const point = dp?.points.find(p => p.id === jackId)
      return point ? `${dp!.deviceLabel} ${point.label}` : prefixedId
    },
    [devicePoints],
  )

  const handleJackClick = useCallback(
    (prefixedId: string) => {
      setSelectedCable(null)
      if (outIds.has(prefixedId)) {
        setPendingFrom(prev => (prev === prefixedId ? null : prefixedId))
      } else {
        if (!pendingFrom) return
        const exists = connections.some(c => c.fromJack === pendingFrom && c.toJack === prefixedId)
        if (!exists) {
          onChange([...connections, { fromJack: pendingFrom, toJack: prefixedId, color: selectedColor }])
        }
        setPendingFrom(null)
      }
    },
    [pendingFrom, selectedColor, connections, onChange, outIds],
  )

  const deleteSelectedCable = useCallback(() => {
    if (selectedCable === null) return
    onChange(connections.filter((_, i) => i !== selectedCable))
    setSelectedCable(null)
  }, [selectedCable, connections, onChange])

  const isTargeting = !!pendingFrom

  return (
    <div className="space-y-3">

      {/* Cable color picker — only shown when managing internally */}
      {!externalColor && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Cable:</span>
          <div className="flex gap-1.5">
            {CABLE_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setInternalColor(c.id)}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  internalColor === c.id ? 'border-white scale-125' : 'border-transparent opacity-60'
                }`}
                style={{ backgroundColor: c.hex }}
                aria-label={`${c.label} cable`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Jack grid — one section per device */}
      {devicePoints.map(dp => (
        <div key={dp.deviceId}>
          <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1">
            {dp.deviceLabel}
          </div>
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-2">
            <div className="grid grid-cols-3 gap-1">
              {[...dp.points]
                .sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
                .map(point => {
                  const prefixedId = prefixJackId(dp.deviceId, point.id)
                  const isOut = point.direction === 'out'
                  const isPending = pendingFrom === prefixedId
                  const isConnected = isOut
                    ? connections.some(c => c.fromJack === prefixedId)
                    : connections.some(c => c.toJack === prefixedId)
                  const connColor = isOut
                    ? connections.find(c => c.fromJack === prefixedId)?.color
                    : connections.find(c => c.toJack === prefixedId)?.color
                  const isClickable = isOut || (isTargeting && !isOut)

                  return (
                    <button
                      key={prefixedId}
                      type="button"
                      data-testid={`jack-${prefixedId}`}
                      onClick={() => handleJackClick(prefixedId)}
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
                      {(isConnected || isPending) && connColor && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isPending ? colorHex(selectedColor) : colorHex(connColor) }}
                        />
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
        </div>
      ))}

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
                <span className="text-orange-400/70">{findLabel(conn.fromJack)}</span>
                <span className="text-zinc-700">→</span>
                <span className="text-zinc-400">{findLabel(conn.toJack)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
