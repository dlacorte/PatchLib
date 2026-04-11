'use client'

import { DFAMPanel } from './DFAMPanel'
import type { ConnectionFormValue, Device } from '@/lib/types'
import { CABLE_COLORS, DFAM_PATCH_POINTS, getJackCoords } from '@/lib/dfam'
import { parseJackId } from '@/lib/devices'

interface PanelStackProps {
  devices: Device[]
  knobSettings: Record<string, Record<string, number>>
  connections: ConnectionFormValue[]
  onChange: (deviceId: string, values: Record<string, number>) => void
  onConnectionsChange: (connections: ConnectionFormValue[]) => void
}

function safeParseJackId(prefixed: string): { deviceId: string; jackId: string } | null {
  try {
    return parseJackId(prefixed)
  } catch {
    return null
  }
}

function cableHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

interface BridgeStripProps {
  sourceDeviceId: string
  targetDeviceId: string
  connections: ConnectionFormValue[]
}

function BridgeStrip({ sourceDeviceId, targetDeviceId, connections }: BridgeStripProps) {
  const bridgeConns = connections.filter(conn => {
    const from = safeParseJackId(conn.fromJack)
    const to = safeParseJackId(conn.toJack)
    if (!from || !to) return false
    return (
      (from.deviceId === sourceDeviceId && to.deviceId === targetDeviceId) ||
      (from.deviceId === targetDeviceId && to.deviceId === sourceDeviceId)
    )
  })

  if (bridgeConns.length === 0) return <div style={{ height: 16 }} />

  return (
    <svg style={{ display: 'block', width: 1300, height: 16 }}>
      {bridgeConns.map(conn => {
        const from = safeParseJackId(conn.fromJack)
        const to = safeParseJackId(conn.toJack)
        if (!from || !to) return null

        const fromPoint = DFAM_PATCH_POINTS.find(p => p.id === from.jackId)
        const toPoint = DFAM_PATCH_POINTS.find(p => p.id === to.jackId)
        if (!fromPoint || !toPoint) return null

        const fromCoords = getJackCoords(fromPoint)
        const toCoords = getJackCoords(toPoint)
        const hex = cableHex(conn.color)

        // x1 = the jack that exits the source panel (bottom edge)
        // x2 = the jack that enters the target panel (top edge)
        const x1 = from.deviceId === sourceDeviceId ? fromCoords.x : toCoords.x
        const x2 = from.deviceId === targetDeviceId ? fromCoords.x : toCoords.x

        return (
          <line
            key={`${conn.fromJack}-${conn.toJack}`}
            x1={x1} y1={0}
            x2={x2} y2={16}
            stroke={hex}
            strokeWidth={2}
            strokeDasharray="4 3"
            data-bridge=""
          />
        )
      })}
    </svg>
  )
}

export function PanelStack({
  devices,
  knobSettings,
  connections,
  onChange,
  onConnectionsChange,
}: PanelStackProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {devices.map((deviceId, idx) => (
        <div key={deviceId}>
          <DFAMPanel
            deviceId={deviceId}
            values={knobSettings[deviceId] ?? {}}
            onChange={(vals) => onChange(deviceId, vals)}
            connections={connections}
            onConnectionsChange={onConnectionsChange}
          />
          {idx < devices.length - 1 && (
            <BridgeStrip
              sourceDeviceId={deviceId}
              targetDeviceId={devices[idx + 1]}
              connections={connections}
            />
          )}
        </div>
      ))}
    </div>
  )
}
