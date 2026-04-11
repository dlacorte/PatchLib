# Multi-Device Patches — Design Spec

## Goal

Allow a patch to document one or more synthesizer devices (DFAM, XFAM, or both) with full knob settings and inter-device cable connections.

---

## New Device: XFAM

XFAM is a hypothetical device with the same panel layout, knobs, and patchbay as the DFAM. It reuses all DFAM definitions — only the name differs. Future devices will each have their own definition file.

---

## Data Model Changes

### `Patch`

| Field | Before | After |
|-------|--------|-------|
| `device` | `String @default("DFAM")` | **deleted** |
| `devices` | — | `String[] @default(["DFAM"])` |

### `KnobSetting`

| Field | Before | After |
|-------|--------|-------|
| `device` | — | `String @default("DFAM")` (new field) |

### `CableConnection`

| Field | Before | After |
|-------|--------|-------|
| `fromJack` | plain jack ID e.g. `"trigger_out"` | prefixed: `"dfam:trigger_out"` |
| `toJack` | plain jack ID e.g. `"trigger_in"` | prefixed: `"xfam:trigger_in"` |

Cross-device example: `fromJack: "dfam:trigger_out"`, `toJack: "xfam:trigger_in"`.
Same-device example: `fromJack: "dfam:vco1_cv_in"`, `toJack: "dfam:vcf_mod_in"`.

---

## New File: `lib/devices.ts`

Central device registry. Each entry maps a device ID to its knob + patchbay definitions.

```ts
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
```

`XFAM` reuses `DFAM_KNOBS` and `DFAM_PATCH_POINTS` directly.

---

## `lib/types.ts` Changes

- `Device` type: `'DFAM' | 'XFAM'` (replaces `'DFAM' | 'Subharmonicon' | 'Mother-32'`)
- `PatchFormValues.devices: string[]` replaces `device: string`
- `ConnectionFormValue.fromJack` / `toJack` now carry device-prefixed IDs

---

## Patch Form UI

### Device selector (top of form)
Checkboxes: `[ ] DFAM   [ ] XFAM`. At least one must be selected.

### Per-device panel
For each selected device, render a `DFAMPanel` (or future device-specific panel) with:
- Device label above the panel: `"DFAM"` / `"XFAM"`
- Knob values scoped to that device (`knobSettings[device][knobId]`)
- `onChange` writes back to the device-scoped state

### Patchbay (connection editor)
The existing `PatchBay` component receives all patch points from all selected devices, each prefixed with the device ID. It renders them grouped by device. The user can draw cables within one device or across devices.

---

## Patch Detail Page UI

- For each device in `patch.devices`: render `DFAMPanelStatic` with that device's knob values and connections filtered to that panel's jacks
- Connections are shown in the panel where the `fromJack` device matches
- Cross-device cables are shown in a separate "Cross-device connections" list below the panels
- Knob table: grouped by device, then by section

---

## Migration

### Prisma migration steps
1. Add `devices String[]` to `Patch`, backfill from existing `device` column, then drop `device`
2. Add `device String @default("DFAM")` to `KnobSetting`, backfill all existing rows to `"DFAM"`
3. Migrate `CableConnection.fromJack` / `toJack`: prefix all existing values with `"dfam:"` in a data migration

### Seed script update
Update `scripts/reseed.ts` to use the new schema.

---

## Files Touched

| Action | File |
|--------|------|
| Create | `lib/devices.ts` |
| Modify | `lib/types.ts` |
| Modify | `prisma/schema.prisma` |
| Create | `prisma/migrations/...` (3 steps above) |
| Modify | `components/patch-form/PatchForm.tsx` |
| Modify | `components/dfam/PatchBay.tsx` (prefixed jack IDs) |
| Modify | `app/patches/[id]/page.tsx` (multi-panel detail view) |
| Modify | `app/api/patches/route.ts` (read/write new fields) |
| Modify | `app/api/patches/[id]/route.ts` (read/write new fields) |
| Modify | `scripts/reseed.ts` |

---

## What Does NOT Change

- `DFAMPanel.tsx` — panel component unchanged
- `DFAMPanelStatic.tsx` — unchanged
- `Knob.tsx`, `WaveToggle.tsx` — unchanged
- Auth, S3 upload, audio player — untouched
- All existing DFAM knob / patchpoint definitions in `lib/dfam.ts`
