'use client'

import { useState, useCallback } from 'react'
import { DFAM_JACKS, CABLE_COLORS, type JackDef } from '@/lib/dfam'

interface Connection {
  fromJack: string
  toJack: string
  color: string
}

interface PatchBayProps {
  connections: Connection[]
  onChange: (connections: Connection[]) => void
}

const ALL_JACKS = [
  ...DFAM_JACKS.outputs,
  ...DFAM_JACKS.inputs,
  ...DFAM_JACKS.audioOutputs,
  ...DFAM_JACKS.audioInputs,
]

const SOURCE_IDS = new Set([
  ...DFAM_JACKS.outputs.map(j => j.id),
  ...DFAM_JACKS.audioOutputs.map(j => j.id),
])

function getJack(id: string): JackDef | undefined {
  return ALL_JACKS.find(j => j.id === id)
}

function colorHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

function JackCircle({
  jack,
  isPending,
  isUsed,
  isTargeting,
  isSource,
  activeCableColor,
  onOutputClick,
  onInputClick,
}: {
  jack: JackDef
  isPending: boolean
  isUsed: boolean
  isTargeting: boolean
  isSource: boolean
  activeCableColor: string
  onOutputClick: (id: string) => void
  onInputClick: (id: string) => void
}) {
  const stroke = isPending
    ? activeCableColor
    : isTargeting && !isSource
    ? activeCableColor
    : isUsed
    ? '#555'
    : '#333'

  return (
    <g
      key={jack.id}
      data-testid={`jack-${jack.id}`}
      onClick={() => (isSource ? onOutputClick(jack.id) : onInputClick(jack.id))}
      style={{ cursor: isSource ? 'pointer' : isTargeting ? 'crosshair' : 'pointer' }}
    >
      <circle
        cx={jack.x} cy={jack.y} r={8}
        fill="#1a1a1a"
        stroke={stroke}
        strokeWidth={isPending ? 2 : 1.5}
        strokeDasharray={!isSource && isTargeting ? '3,2' : undefined}
      />
      {isPending && (
        <circle cx={jack.x} cy={jack.y} r={3.5} fill={activeCableColor} opacity={0.9} />
      )}
      <text x={jack.x} y={jack.y + 17} textAnchor="middle" fill="#555" fontSize="7">
        {jack.label}
      </text>
    </g>
  )
}

export function PatchBay({ connections, onChange }: PatchBayProps) {
  const [pendingFrom, setPendingFrom] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState('orange')
  const [selectedCable, setSelectedCable] = useState<number | null>(null)

  const handleOutputClick = useCallback((jackId: string) => {
    setSelectedCable(null)
    setPendingFrom(prev => (prev === jackId ? null : jackId))
  }, [])

  const handleInputClick = useCallback(
    (jackId: string) => {
      if (!pendingFrom) return
      const exists = connections.some(c => c.fromJack === pendingFrom && c.toJack === jackId)
      if (!exists) {
        onChange([...connections, { fromJack: pendingFrom, toJack: jackId, color: selectedColor }])
      }
      setPendingFrom(null)
    },
    [pendingFrom, selectedColor, connections, onChange],
  )

  const handleCableClick = useCallback((i: number) => {
    setPendingFrom(null)
    setSelectedCable(prev => (prev === i ? null : i))
  }, [])

  const deleteSelectedCable = useCallback(() => {
    if (selectedCable === null) return
    onChange(connections.filter((_, i) => i !== selectedCable))
    setSelectedCable(null)
  }, [selectedCable, connections, onChange])

  const activeCableColor = colorHex(selectedColor)
  const isTargeting = !!pendingFrom

  function jackProps(jack: JackDef) {
    const isSource = SOURCE_IDS.has(jack.id)
    return {
      jack,
      isPending: pendingFrom === jack.id,
      isUsed: isSource
        ? connections.some(c => c.fromJack === jack.id)
        : connections.some(c => c.toJack === jack.id),
      isTargeting,
      isSource,
      activeCableColor,
      onOutputClick: handleOutputClick,
      onInputClick: handleInputClick,
    }
  }

  return (
    <div className="space-y-3">
      {/* Color picker */}
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

      {/* SVG patch bay */}
      <div className="bg-[#0f0f0f] border border-zinc-800 rounded overflow-hidden">
        <svg
          width="100%"
          viewBox="0 0 700 160"
          className="block"
          style={{ fontFamily: 'monospace' }}
        >
          <text x="4" y="32" fill="#3a3a3a" fontSize="8">OUT</text>
          <text x="4" y="86" fill="#3a3a3a" fontSize="8">IN</text>
          <text x="4" y="140" fill="#3a3a3a" fontSize="8">AUDIO</text>

          {/* Divider before audio row */}
          <line x1="0" y1="112" x2="700" y2="112" stroke="#1e1e1e" strokeWidth="1" />

          {/* Cables */}
          {connections.map((conn, i) => {
            const from = getJack(conn.fromJack)
            const to = getJack(conn.toJack)
            if (!from || !to) return null
            const midY = (from.y + to.y) / 2 + 8
            const hex = colorHex(conn.color)
            const isSelected = selectedCable === i
            return (
              <path
                key={i}
                data-cable
                d={`M ${from.x},${from.y} C ${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`}
                stroke={hex}
                strokeWidth={isSelected ? 3 : 2}
                fill="none"
                strokeOpacity={isSelected ? 1 : 0.75}
                style={{ cursor: 'pointer' }}
                onClick={() => handleCableClick(i)}
              />
            )
          })}

          {/* CV Output jacks */}
          {DFAM_JACKS.outputs.map(jack => (
            <JackCircle key={jack.id} {...jackProps(jack)} />
          ))}

          {/* CV Input jacks */}
          {DFAM_JACKS.inputs.map(jack => (
            <JackCircle key={jack.id} {...jackProps(jack)} />
          ))}

          {/* Audio output jacks */}
          {DFAM_JACKS.audioOutputs.map(jack => (
            <JackCircle key={jack.id} {...jackProps(jack)} />
          ))}

          {/* Audio input jacks */}
          {DFAM_JACKS.audioInputs.map(jack => (
            <JackCircle key={jack.id} {...jackProps(jack)} />
          ))}
        </svg>
      </div>

      {/* Status / actions */}
      <div className="flex items-center gap-3 min-h-[24px]">
        {pendingFrom && (
          <p className="text-[10px] text-orange-400 font-mono">
            Click an input jack to complete the connection
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
    </div>
  )
}
