'use client'

import { useRef, useCallback } from 'react'

interface KnobProps {
  id: string
  label: string
  value: number
  onChange: (id: string, value: number) => void
  min?: number     // default 0
  max?: number     // default 10
  size?: number    // SVG size in px, default 48
}

const MIN_ANGLE = -135
const MAX_ANGLE = 135
const SWEEP = MAX_ANGLE - MIN_ANGLE // 270°

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

export function Knob({ id, label, value, onChange, min = 0, max = 10, size = 48 }: KnobProps) {
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startValue = useRef(0)

  const range = max - min
  const r = size / 2
  const angle = MIN_ANGLE + ((value - min) / range) * SWEEP
  const rad = (angle * Math.PI) / 180
  const indicatorOuter = r - 5
  const indicatorInner = r - 5 - r * 0.35
  const ox = r + Math.sin(rad) * indicatorOuter
  const oy = r - Math.cos(rad) * indicatorOuter
  const ix = r + Math.sin(rad) * indicatorInner
  const iy = r - Math.cos(rad) * indicatorInner

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault()
      isDragging.current = true
      startY.current = e.clientY
      startValue.current = value
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [value],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging.current) return
      const delta = (startY.current - e.clientY) / 100
      const next = clamp(startValue.current + delta * range, min, max)
      onChange(id, Math.round(next * 10) / 10)
    },
    [id, onChange, min, max, range],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  // Bipolar knobs show sign prefix
  const displayValue = min < 0
    ? (value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1))
    : value.toFixed(1)

  return (
    <div className="flex flex-col items-center gap-0.5 select-none" data-testid={`knob-${id}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ cursor: 'ns-resize', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label={`${label} knob, value ${value}`}
      >
        <circle cx={r} cy={r} r={r - 3} fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5" />
        <line
          x1={ix} y1={iy}
          x2={ox} y2={oy}
          stroke="#e07b39"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[9px] text-orange-400 font-mono leading-none">{displayValue}</span>
      <span className="text-[8px] text-zinc-500 uppercase tracking-wide text-center leading-tight max-w-[48px]">
        {label}
      </span>
    </div>
  )
}
