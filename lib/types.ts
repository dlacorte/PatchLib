import type { Patch, KnobSetting, CableConnection } from '@prisma/client'

export type PatchWithRelations = Patch & {
  knobSettings: KnobSetting[]
  connections: CableConnection[]
}

export type PatchListItem = Patch & {
  _count: { connections: number }
}

// Shape used in the create/edit form — before saving to DB
export interface PatchFormValues {
  name: string
  description: string
  tags: string[]
  knobSettings: Record<string, number>   // knobId → value (0–10)
  connections: ConnectionFormValue[]
  sequenceNotes: string
  audioUrl: string
}

export interface ConnectionFormValue {
  fromJack: string
  toJack: string
  color: string
}
