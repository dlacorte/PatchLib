import { DFAM_PATCH_POINTS, CABLE_COLORS, getJackCoords } from '@/lib/dfam'
import { prefixJackId, parseJackId } from '@/lib/devices'

interface Connection {
  fromJack: string
  toJack: string
  color: string
}

interface CableSVGProps {
  deviceId: string
  connections: Connection[]
  pendingJack: string | null
  selectedCable: number | null
  selectedColor: string
  onJackClick: (jackId: string) => void
  onCableSelect: (index: number) => void
  onCableDelete: () => void
  readonly?: boolean
}

function cableHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

function safeParseJackId(prefixed: string): { deviceId: string; jackId: string } | null {
  try {
    return parseJackId(prefixed)
  } catch {
    return null
  }
}

export function CableSVG({
  deviceId,
  connections,
  pendingJack,
  selectedCable,
  selectedColor,
  onJackClick,
  onCableSelect,
  onCableDelete,
  readonly = false,
}: CableSVGProps) {
  // Same-device connections: both jacks belong to this device
  const localConns = connections
    .map((conn, i) => ({ conn, i }))
    .filter(({ conn }) => {
      const from = safeParseJackId(conn.fromJack)
      const to = safeParseJackId(conn.toJack)
      return from?.deviceId === deviceId && to?.deviceId === deviceId
    })

  // Cross-device exits: this device is source
  const exitConns = connections.filter(conn => {
    const from = safeParseJackId(conn.fromJack)
    const to = safeParseJackId(conn.toJack)
    return from?.deviceId === deviceId && to !== null && to.deviceId !== deviceId
  })

  // Cross-device entries: this device is target
  const entryConns = connections.filter(conn => {
    const from = safeParseJackId(conn.fromJack)
    const to = safeParseJackId(conn.toJack)
    return to?.deviceId === deviceId && from !== null && from.deviceId !== deviceId
  })

  return (
    <>
      {/* ── Same-device cables ──────────────────────────────────────── */}
      {localConns.map(({ conn, i }) => {
        const fromParsed = safeParseJackId(conn.fromJack)
        const toParsed = safeParseJackId(conn.toJack)
        if (!fromParsed || !toParsed) return null
        const fromPoint = DFAM_PATCH_POINTS.find(p => p.id === fromParsed.jackId)
        const toPoint = DFAM_PATCH_POINTS.find(p => p.id === toParsed.jackId)
        if (!fromPoint || !toPoint) return null

        const { x: x1, y: y1 } = getJackCoords(fromPoint)
        const { x: x2, y: y2 } = getJackCoords(toPoint)
        const dist = Math.hypot(x2 - x1, y2 - y1)
        const sag = Math.max(20, Math.min(80, dist * 0.3))
        const d = `M ${x1} ${y1} C ${x1} ${y1 + sag} ${x2} ${y2 + sag} ${x2} ${y2}`
        const hex = cableHex(conn.color)
        const isSelected = selectedCable === i

        return (
          <g key={`cable-${i}`}>
            {/* Hit area */}
            <path
              d={d}
              stroke="transparent"
              strokeWidth={12}
              fill="none"
              data-cable-hit=""
              style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onClick={() => onCableSelect(i)}
            />
            {/* Visual cable */}
            <path
              d={d}
              stroke={isSelected ? '#ef4444' : hex}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              data-cable="full"
              style={{ pointerEvents: 'none' }}
            />
            {/* Selected endpoint rings */}
            {isSelected && (
              <>
                <circle cx={x1} cy={y1} r={14} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
                <circle cx={x2} cy={y2} r={14} fill="none" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
              </>
            )}
          </g>
        )
      })}

      {/* ── Cross-device exit half-cables ──────────────────────────── */}
      {exitConns.map((conn, exitIdx) => {
        const fromParsed = safeParseJackId(conn.fromJack)
        if (!fromParsed) return null
        const point = DFAM_PATCH_POINTS.find(p => p.id === fromParsed.jackId)
        if (!point) return null
        const { x, y } = getJackCoords(point)
        const hex = cableHex(conn.color)
        const d = `M ${x} ${y} C ${x} ${y + 60} ${x} 559 ${x} 559`
        return (
          <g key={`exit-${exitIdx}`}>
            <path d={d} stroke={hex} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray="5 3" data-cable="exit" />
            <circle cx={x} cy={559} r={4} fill={hex} />
          </g>
        )
      })}

      {/* ── Cross-device entry half-cables ─────────────────────────── */}
      {entryConns.map((conn, entryIdx) => {
        const toParsed = safeParseJackId(conn.toJack)
        if (!toParsed) return null
        const point = DFAM_PATCH_POINTS.find(p => p.id === toParsed.jackId)
        if (!point) return null
        const { x, y } = getJackCoords(point)
        const hex = cableHex(conn.color)
        const d = `M ${x} 0 C ${x} 60 ${x} ${y - 60} ${x} ${y}`
        return (
          <g key={`entry-${entryIdx}`}>
            <circle cx={x} cy={0} r={4} fill={hex} />
            <path d={d} stroke={hex} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray="5 3" data-cable="entry" />
          </g>
        )
      })}

      {/* ── Jack overlay circles + pending glow ─────────────────────── */}
      {DFAM_PATCH_POINTS.map(point => {
        const prefixedId = prefixJackId(deviceId, point.id)
        const { x, y } = getJackCoords(point)
        const isPending = pendingJack === prefixedId
        return (
          <g key={point.id}>
            {isPending && (
              <circle
                cx={x} cy={y} r={14}
                fill="none"
                stroke="#e07b39"
                strokeWidth={2}
                opacity={0.85}
                data-pending=""
              />
            )}
            {!readonly && (
              <circle
                cx={x} cy={y} r={14}
                fill="transparent"
                data-jack={prefixedId}
                style={{ pointerEvents: 'all', cursor: 'crosshair' }}
                onClick={() => onJackClick(prefixedId)}
              />
            )}
          </g>
        )
      })}
    </>
  )
}
