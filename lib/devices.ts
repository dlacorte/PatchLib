import { DFAM_KNOBS, DFAM_PATCH_POINTS, type KnobDef, type PatchPointDef } from '@/lib/dfam'
import type { Device } from '@/lib/types'

export interface DeviceDef {
  id: Device
  label: string
  patchPoints: PatchPointDef[]
  knobs: KnobDef[]
}

export const DEVICES: DeviceDef[] = [
  {
    id: 'DFAM',
    label: 'DFAM',
    patchPoints: DFAM_PATCH_POINTS,
    knobs: DFAM_KNOBS,
  },
  {
    id: 'XFAM',
    label: 'XFAM',
    // XFAM shares the same patch point layout as DFAM
    patchPoints: DFAM_PATCH_POINTS,
    knobs: DFAM_KNOBS,
  },
]

export function getDevice(id: Device): DeviceDef {
  const def = DEVICES.find(d => d.id === id)
  if (!def) throw new Error(`Unknown device: ${id}`)
  return def
}

/**
 * Returns a prefixed jack ID in the form `<deviceId_lowercase>:<jackId>`.
 * e.g. prefixJackId('DFAM', 'trigger_out') => 'dfam:trigger_out'
 */
export function prefixJackId(deviceId: string, jackId: string): string {
  return `${deviceId.toLowerCase()}:${jackId}`
}

/**
 * Parses a prefixed jack ID back into deviceId and jackId.
 * e.g. parseJackId('dfam:trigger_out') => { deviceId: 'DFAM', jackId: 'trigger_out' }
 */
export function parseJackId(prefixedId: string): { deviceId: string; jackId: string } {
  const colon = prefixedId.indexOf(':')
  if (colon === -1) return { deviceId: '', jackId: prefixedId }
  return {
    deviceId: prefixedId.slice(0, colon).toUpperCase(),
    jackId: prefixedId.slice(colon + 1),
  }
}
