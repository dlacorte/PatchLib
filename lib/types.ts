import type { Patch, KnobSetting, CableConnection } from '@prisma/client'

export type Device = 'DFAM' | 'XFAM'

export const SUPPORTED_DEVICES: Device[] = ['DFAM', 'XFAM']

export type PatchWithRelations = Patch & {
  knobSettings: KnobSetting[]
  connections: CableConnection[]
}

export type PatchListItem = Patch & {
  _count: { connections: number }
  user: { displayName: string | null; email: string }
}

// knobSettings is now nested by device: { DFAM: { vco_decay: 8 }, XFAM: { vco_decay: 5 } }
export interface PatchFormValues {
  name: string
  description: string
  devices: Device[]
  tags: string[]
  knobSettings: Record<string, Record<string, number>>  // deviceId → knobId → value
  connections: ConnectionFormValue[]
  sequenceNotes: string
  audioUrl: string
  isPublic: boolean
}

export interface ConnectionFormValue {
  fromJack: string  // prefixed: "dfam:trigger_out"
  toJack: string    // prefixed: "xfam:trigger_in"
  color: string
}
