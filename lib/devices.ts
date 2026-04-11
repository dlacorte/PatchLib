import { DFAM_KNOBS, DFAM_PATCH_POINTS, type KnobDef, type PatchPointDef } from '@/lib/dfam'

export interface DeviceDef {
  id: string
  label: string
  knobs: KnobDef[]
  patchPoints: PatchPointDef[]
}

export const DEVICES: DeviceDef[] = [
  { id: 'DFAM', label: 'DFAM', knobs: DFAM_KNOBS, patchPoints: DFAM_PATCH_POINTS },
  { id: 'XFAM', label: 'XFAM', knobs: DFAM_KNOBS, patchPoints: DFAM_PATCH_POINTS },
]

export function getDevice(id: string): DeviceDef {
  const d = DEVICES.find(d => d.id === id)
  if (!d) throw new Error(`Unknown device: ${id}`)
  return d
}

/** "DFAM" + "trigger_out" → "dfam:trigger_out" */
export function prefixJackId(deviceId: string, jackId: string): string {
  return `${deviceId.toLowerCase()}:${jackId}`
}

/** "dfam:trigger_out" → { deviceId: "DFAM", jackId: "trigger_out" } */
export function parseJackId(prefixed: string): { deviceId: string; jackId: string } {
  const colon = prefixed.indexOf(':')
  if (colon === -1) throw new Error(`Jack ID has no device prefix: ${prefixed}`)
  return {
    deviceId: prefixed.slice(0, colon).toUpperCase(),
    jackId: prefixed.slice(colon + 1),
  }
}
