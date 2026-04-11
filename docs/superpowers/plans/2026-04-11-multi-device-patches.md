# Multi-Device Patches (DFAM + XFAM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a patch to document one or more synthesizer devices (DFAM, XFAM, or both) with full knob settings and inter-device cable connections.

**Architecture:** Add a device registry in `lib/devices.ts`. Migrate `Patch.device: String` → `Patch.devices: String[]` and add `KnobSetting.device: String`. Cable jack IDs become device-prefixed (`"dfam:trigger_out"`). `PatchBay` accepts multi-device patch points. `PatchForm` gains a device selector. The detail page renders one panel per device.

**Tech Stack:** Next.js 14 App Router, Prisma 7 + Aurora Serverless v2 (PostgreSQL), TypeScript, React, Tailwind, `@prisma/adapter-pg`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `lib/devices.ts` | Device registry — maps device ID to knob + patchbay definitions |
| Modify | `lib/types.ts` | Update `Device` type, `PatchFormValues` shape |
| Modify | `prisma/schema.prisma` | Add `Patch.devices[]`, `KnobSetting.device`, remove `Patch.device` |
| Modify | `app/api/patches/route.ts` | Read/write new schema fields |
| Modify | `app/api/patches/[id]/route.ts` | Read/write new schema fields |
| Modify | `components/dfam/PatchBay.tsx` | Accept `devicePoints` prop, handle prefixed jack IDs |
| Modify | `components/patch-form/PatchForm.tsx` | Device selector, per-device knob state |
| Modify | `app/patches/[id]/page.tsx` | Multi-device panel + knob table |
| Modify | `scripts/reseed.ts` | Update seed for new schema |
| Modify | `__tests__/components/PatchBay.test.tsx` | Update for new props |
| Modify | `__tests__/components/PatchForm.test.tsx` | Update for device selector |

---

## Task 1: Device Registry

**Files:**
- Create: `lib/devices.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/devices.test.ts`:

```ts
import { DEVICES, getDevice, prefixJackId, parseJackId } from '@/lib/devices'

describe('DEVICES', () => {
  it('contains DFAM and XFAM', () => {
    const ids = DEVICES.map(d => d.id)
    expect(ids).toContain('DFAM')
    expect(ids).toContain('XFAM')
  })

  it('XFAM has same number of knobs as DFAM', () => {
    const dfam = getDevice('DFAM')
    const xfam = getDevice('XFAM')
    expect(xfam.knobs.length).toBe(dfam.knobs.length)
  })

  it('getDevice throws on unknown device', () => {
    expect(() => getDevice('BOGUS')).toThrow('Unknown device: BOGUS')
  })
})

describe('prefixJackId / parseJackId', () => {
  it('prefixes a jack ID with device', () => {
    expect(prefixJackId('DFAM', 'trigger_out')).toBe('dfam:trigger_out')
  })

  it('parses a prefixed jack ID', () => {
    expect(parseJackId('dfam:trigger_out')).toEqual({ deviceId: 'DFAM', jackId: 'trigger_out' })
  })

  it('parseJackId throws on unprefixed ID', () => {
    expect(() => parseJackId('trigger_out')).toThrow()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/lib/devices.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/devices'`

- [ ] **Step 3: Create `lib/devices.ts`**

```ts
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
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx jest __tests__/lib/devices.test.ts --no-coverage
```

Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add lib/devices.ts __tests__/lib/devices.test.ts
git commit -m "feat: add device registry with DFAM + XFAM"
```

---

## Task 2: Update Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Update `lib/types.ts`**

Replace the entire file:

```ts
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
```

- [ ] **Step 2: Run existing tests to find type breakage**

```bash
npx jest --no-coverage 2>&1 | grep -E "FAIL|PASS|error" | head -20
```

Note which tests fail — they will be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: update types for multi-device patches"
```

---

## Task 3: Prisma Schema — Add New Fields

**Files:**
- Modify: `prisma/schema.prisma`

> **Context:** This is a two-phase migration. Phase 1 (this task) adds new columns while keeping the old `device` column. Phase 2 (Task 5) drops the old column after data migration.

- [ ] **Step 1: Edit `prisma/schema.prisma` — add new fields, keep `device`**

In the `Patch` model, add `devices` after `device`:

```prisma
model Patch {
  id            String            @id @default(cuid())
  name          String
  device        String            @default("DFAM")   // kept for migration, removed in Task 5
  devices       String[]          @default([])
  description   String?
  tags          String[]
  isPublic      Boolean           @default(false)
  userId        String
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  knobSettings  KnobSetting[]
  connections   CableConnection[]
  sequenceNotes String?
  audioUrl      String?
  photoUrl      String?
}
```

In the `KnobSetting` model, add `device`:

```prisma
model KnobSetting {
  id      String @id @default(cuid())
  patch   Patch  @relation(fields: [patchId], references: [id], onDelete: Cascade)
  patchId String
  device  String @default("DFAM")
  knobId  String
  value   Float
}
```

- [ ] **Step 2: Create migration**

```bash
DATABASE_URL="postgresql://patchlib_admin:REDACTED@patchlib-aurora.cluster-cudka60y023m.us-east-1.rds.amazonaws.com:5432/patchlib" npx prisma migrate dev --name add_devices_and_knobsetting_device
```

Expected: migration created and applied successfully.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Patch.devices[] and KnobSetting.device to schema"
```

---

## Task 4: Data Migration — Backfill + Prefix Jack IDs

**Files:**
- Create: `scripts/migrate-to-multi-device.ts`

> **Context:** Existing rows have `device = "DFAM"`. We need to:
> 1. Backfill `Patch.devices = ["DFAM"]` from `Patch.device`
> 2. Prefix all `CableConnection.fromJack` / `toJack` with `"dfam:"`
> 3. Set `KnobSetting.device = "DFAM"` (already handled by `@default("DFAM")` — verify only)

- [ ] **Step 1: Create migration script**

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Backfill Patch.devices from Patch.device
  const patches = await prisma.patch.findMany({ select: { id: true, device: true, devices: true } })
  let patchesUpdated = 0
  for (const p of patches) {
    if (p.devices.length === 0) {
      await prisma.patch.update({
        where: { id: p.id },
        // @ts-ignore — device still exists at this migration step
        data: { devices: [p.device ?? 'DFAM'] },
      })
      patchesUpdated++
    }
  }
  console.log(`Backfilled devices on ${patchesUpdated} patches`)

  // 2. Prefix CableConnection jack IDs
  const conns = await prisma.cableConnection.findMany()
  let connsUpdated = 0
  for (const c of conns) {
    const needsPrefix = !c.fromJack.includes(':')
    if (needsPrefix) {
      await prisma.cableConnection.update({
        where: { id: c.id },
        data: {
          fromJack: `dfam:${c.fromJack}`,
          toJack: `dfam:${c.toJack}`,
        },
      })
      connsUpdated++
    }
  }
  console.log(`Prefixed jack IDs on ${connsUpdated} connections`)

  // 3. Verify KnobSetting.device (should all be 'DFAM' via default)
  const knobsWithoutDevice = await prisma.knobSetting.count({ where: { device: { not: 'DFAM' } } })
  console.log(`KnobSettings with non-DFAM device: ${knobsWithoutDevice} (expected 0)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run migration script**

```bash
DATABASE_URL="postgresql://patchlib_admin:REDACTED@patchlib-aurora.cluster-cudka60y023m.us-east-1.rds.amazonaws.com:5432/patchlib" npx tsx scripts/migrate-to-multi-device.ts
```

Expected output:
```
Backfilled devices on N patches
Prefixed jack IDs on N connections
KnobSettings with non-DFAM device: 0 (expected 0)
```

- [ ] **Step 3: Commit**

```bash
git add scripts/migrate-to-multi-device.ts
git commit -m "feat: data migration — backfill devices and prefix jack IDs"
```

---

## Task 5: Prisma Schema — Remove Old `device` Field

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Remove `device` from Patch model**

Edit `prisma/schema.prisma` — delete the `device` line from the `Patch` model:

```prisma
model Patch {
  id            String            @id @default(cuid())
  name          String
  // device line deleted
  devices       String[]          @default([])
  description   String?
  tags          String[]
  isPublic      Boolean           @default(false)
  userId        String
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  knobSettings  KnobSetting[]
  connections   CableConnection[]
  sequenceNotes String?
  audioUrl      String?
  photoUrl      String?
}
```

- [ ] **Step 2: Run migration to drop old column**

```bash
DATABASE_URL="postgresql://patchlib_admin:REDACTED@patchlib-aurora.cluster-cudka60y023m.us-east-1.rds.amazonaws.com:5432/patchlib" npx prisma migrate dev --name drop_patch_device_column
```

Expected: migration applied successfully.

- [ ] **Step 3: Verify Prisma client is updated**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: drop Patch.device column, devices[] is now canonical"
```

---

## Task 6: Update API Routes

**Files:**
- Modify: `app/api/patches/route.ts`
- Modify: `app/api/patches/[id]/route.ts`

- [ ] **Step 1: Update `app/api/patches/route.ts`**

Replace the entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const tagsParam = searchParams.get('tags') || ''
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []

  const patches = await prisma.patch.findMany({
    where: {
      userId: session.user.id,
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        tags.length > 0 ? { tags: { hasSome: tags } } : {},
      ],
    },
    include: { _count: { select: { connections: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(patches)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const {
    name, devices, description, tags,
    knobSettings, connections, sequenceNotes, audioUrl, photoUrl, isPublic,
  } = body

  // knobSettings from client: [{ device: 'DFAM', knobId: 'vco_decay', value: 8 }, ...]
  const patch = await prisma.patch.create({
    data: {
      name,
      devices: devices?.length ? devices : ['DFAM'],
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      isPublic: isPublic ?? false,
      userId: session.user.id,
      knobSettings: {
        create: (knobSettings || []).map((k: { device: string; knobId: string; value: number }) => ({
          device: k.device || 'DFAM',
          knobId: k.knobId,
          value: k.value,
        })),
      },
      connections: {
        create: (connections || []).map((c: { fromJack: string; toJack: string; color: string }) => ({
          fromJack: c.fromJack,
          toJack: c.toJack,
          color: c.color,
        })),
      },
    },
    include: { knobSettings: true, connections: true },
  })

  return NextResponse.json(patch, { status: 201 })
}
```

- [ ] **Step 2: Update `app/api/patches/[id]/route.ts`**

Replace the entire file:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const patch = await prisma.patch.findUnique({
    where: { id: params.id },
    include: { knobSettings: true, connections: true },
  })
  if (!patch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(patch)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.patch.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const {
    name, devices, description, tags,
    knobSettings, connections, sequenceNotes, audioUrl, photoUrl, isPublic,
  } = body

  await prisma.knobSetting.deleteMany({ where: { patchId: params.id } })
  await prisma.cableConnection.deleteMany({ where: { patchId: params.id } })

  const patch = await prisma.patch.update({
    where: { id: params.id },
    data: {
      name,
      devices: devices?.length ? devices : ['DFAM'],
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      isPublic: isPublic ?? existing.isPublic,
      knobSettings: {
        create: (knobSettings || []).map((k: { device: string; knobId: string; value: number }) => ({
          device: k.device || 'DFAM',
          knobId: k.knobId,
          value: k.value,
        })),
      },
      connections: {
        create: (connections || []).map((c: { fromJack: string; toJack: string; color: string }) => ({
          fromJack: c.fromJack,
          toJack: c.toJack,
          color: c.color,
        })),
      },
    },
    include: { knobSettings: true, connections: true },
  })

  return NextResponse.json(patch)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.patch.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.patch.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `device` field.

- [ ] **Step 4: Commit**

```bash
git add app/api/patches/route.ts app/api/patches/\[id\]/route.ts
git commit -m "feat: update API routes for multi-device schema"
```

---

## Task 7: Update PatchBay for Multi-Device

**Files:**
- Modify: `components/dfam/PatchBay.tsx`
- Modify: `__tests__/components/PatchBay.test.tsx`

- [ ] **Step 1: Update the PatchBay test first**

Read the current test at `__tests__/components/PatchBay.test.tsx` to understand existing tests, then replace the file:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PatchBay } from '@/components/dfam/PatchBay'
import { DFAM_PATCH_POINTS } from '@/lib/dfam'

const dfamPoints = { deviceId: 'DFAM', deviceLabel: 'DFAM', points: DFAM_PATCH_POINTS }

describe('PatchBay', () => {
  it('renders all jack buttons for a single device', () => {
    render(<PatchBay devicePoints={[dfamPoints]} connections={[]} onChange={jest.fn()} />)
    // Each jack has a button
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renders device section label', () => {
    render(<PatchBay devicePoints={[dfamPoints]} connections={[]} onChange={jest.fn()} />)
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('clicking an out jack then an in jack adds a connection with prefixed IDs', () => {
    const onChange = jest.fn()
    render(<PatchBay devicePoints={[dfamPoints]} connections={[]} onChange={onChange} selectedColor="orange" />)
    fireEvent.click(screen.getByTestId('jack-dfam:trigger_out'))
    fireEvent.click(screen.getByTestId('jack-dfam:trigger_in'))
    expect(onChange).toHaveBeenCalledWith([
      { fromJack: 'dfam:trigger_out', toJack: 'dfam:trigger_in', color: 'orange' },
    ])
  })

  it('renders two device sections when two devices passed', () => {
    render(
      <PatchBay
        devicePoints={[dfamPoints, { deviceId: 'XFAM', deviceLabel: 'XFAM', points: DFAM_PATCH_POINTS }]}
        connections={[]}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByText('DFAM')).toBeInTheDocument()
    expect(screen.getByText('XFAM')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/components/PatchBay.test.tsx --no-coverage
```

Expected: FAIL — `devicePoints` prop not found, `jack-dfam:trigger_out` not found

- [ ] **Step 3: Rewrite `components/dfam/PatchBay.tsx`**

Replace the entire file:

```tsx
'use client'

import { useState, useCallback } from 'react'
import { CABLE_COLORS, type PatchPointDef } from '@/lib/dfam'
import { prefixJackId } from '@/lib/devices'

interface Connection {
  fromJack: string
  toJack: string
  color: string
}

export interface DevicePoints {
  deviceId: string
  deviceLabel: string
  points: PatchPointDef[]
}

interface PatchBayProps {
  devicePoints: DevicePoints[]
  connections: Connection[]
  onChange: (connections: Connection[]) => void
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
  const outIds = new Set(
    devicePoints.flatMap(dp =>
      dp.points.filter(p => p.direction === 'out').map(p => prefixJackId(dp.deviceId, p.id))
    )
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
            // Find the label for a prefixed jack ID across all devices
            const findLabel = (prefixedId: string) => {
              const colon = prefixedId.indexOf(':')
              if (colon === -1) return prefixedId
              const devId = prefixedId.slice(0, colon).toUpperCase()
              const jackId = prefixedId.slice(colon + 1)
              const dp = devicePoints.find(d => d.deviceId === devId)
              const point = dp?.points.find(p => p.id === jackId)
              return point ? `${dp!.deviceLabel} ${point.label}` : prefixedId
            }
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
```

- [ ] **Step 4: Run PatchBay tests**

```bash
npx jest __tests__/components/PatchBay.test.tsx --no-coverage
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add components/dfam/PatchBay.tsx __tests__/components/PatchBay.test.tsx
git commit -m "feat: update PatchBay for multi-device prefixed jack IDs"
```

---

## Task 8: Update PatchForm

**Files:**
- Modify: `components/patch-form/PatchForm.tsx`
- Modify: `__tests__/components/PatchForm.test.tsx`

- [ ] **Step 1: Update `__tests__/components/PatchForm.test.tsx`**

Replace the file:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatchForm } from '@/components/patch-form/PatchForm'
import { VisibilityToggle } from '@/components/ui/VisibilityToggle'
import type { PatchFormValues } from '@/lib/types'

jest.mock('@/components/dfam/DFAMPanel', () => ({
  DFAMPanel: ({
    onChange,
    onConnectionsChange,
  }: {
    onChange: (v: Record<string, number>) => void
    onConnectionsChange: (c: unknown[]) => void
  }) => (
    <div
      data-testid="dfam-panel"
      onClick={() => {
        onChange({ tempo: 7 })
        onConnectionsChange([])
      }}
    />
  ),
}))

jest.mock('@/components/dfam/PatchBay', () => ({
  PatchBay: ({ onChange }: { onChange: (c: unknown[]) => void }) => (
    <div data-testid="patch-bay" onClick={() => onChange([])} />
  ),
}))

const defaultValues: PatchFormValues = {
  name: '',
  description: '',
  devices: ['DFAM'],
  tags: [],
  knobSettings: { DFAM: {} },
  connections: [],
  sequenceNotes: '',
  audioUrl: '',
  isPublic: false,
}

describe('PatchForm', () => {
  it('renders name input', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByPlaceholderText(/patch name/i)).toBeInTheDocument()
  })

  it('renders device checkboxes', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByLabelText('DFAM')).toBeInTheDocument()
    expect(screen.getByLabelText('XFAM')).toBeInTheDocument()
  })

  it('renders dfam panel when DFAM is selected', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByTestId('dfam-panel')).toBeInTheDocument()
  })

  it('renders patch bay section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/patch bay/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct devices', () => {
    const onSubmit = jest.fn()
    render(<PatchForm defaultValues={defaultValues} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/patch name/i), { target: { value: 'My Patch' } })
    fireEvent.click(screen.getByText(/save patch/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ devices: ['DFAM'] }))
  })
})

describe('VisibilityToggle', () => {
  it('shows "private" when value is false', () => {
    render(<VisibilityToggle value={false} onChange={() => {}} />)
    expect(screen.getByText('private')).toBeInTheDocument()
  })

  it('shows "public" when value is true', () => {
    render(<VisibilityToggle value={true} onChange={() => {}} />)
    expect(screen.getByText('public')).toBeInTheDocument()
  })

  it('calls onChange with toggled value on click', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<VisibilityToggle value={false} onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/components/PatchForm.test.tsx --no-coverage
```

Expected: FAIL — `devices` prop missing, no `XFAM` checkbox

- [ ] **Step 3: Rewrite `components/patch-form/PatchForm.tsx`**

Replace the entire file:

```tsx
'use client'

import { useState, useCallback } from 'react'
import type { PatchFormValues, ConnectionFormValue, Device } from '@/lib/types'
import { SUPPORTED_DEVICES } from '@/lib/types'
import { DEVICES, getDevice } from '@/lib/devices'
import { DFAMPanel } from '@/components/dfam/DFAMPanel'
import { PatchBay, type DevicePoints } from '@/components/dfam/PatchBay'
import { AudioUpload } from '@/components/audio/AudioUpload'
import { VisibilityToggle } from '@/components/ui/VisibilityToggle'

interface PatchFormProps {
  defaultValues: PatchFormValues
  onSubmit: (values: PatchFormValues) => void
  isSubmitting?: boolean
}

export function PatchForm({ defaultValues, onSubmit, isSubmitting = false }: PatchFormProps) {
  const [name, setName] = useState(defaultValues.name)
  const [description, setDescription] = useState(defaultValues.description)
  const [tagsInput, setTagsInput] = useState(defaultValues.tags.join(', '))
  const [devices, setDevices] = useState<Device[]>(defaultValues.devices)
  // knobSettings: deviceId → knobId → value
  const [knobSettings, setKnobSettings] = useState<Record<string, Record<string, number>>>(
    defaultValues.knobSettings
  )
  const [connections, setConnections] = useState<ConnectionFormValue[]>(defaultValues.connections)
  const [sequenceNotes, setSequenceNotes] = useState(defaultValues.sequenceNotes)
  const [audioUrl, setAudioUrl] = useState(defaultValues.audioUrl)
  const [isPublic, setIsPublic] = useState(defaultValues.isPublic ?? false)

  const toggleDevice = useCallback((deviceId: Device) => {
    setDevices(prev => {
      if (prev.includes(deviceId)) {
        if (prev.length === 1) return prev // must have at least one
        return prev.filter(d => d !== deviceId)
      }
      return [...prev, deviceId]
    })
  }, [])

  const handleKnobChange = useCallback((deviceId: string, values: Record<string, number>) => {
    setKnobSettings(prev => ({ ...prev, [deviceId]: values }))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
      onSubmit({ name, description, devices, tags, knobSettings, connections, sequenceNotes, audioUrl, isPublic })
    },
    [name, description, devices, tagsInput, knobSettings, connections, sequenceNotes, audioUrl, isPublic, onSubmit],
  )

  const devicePoints: DevicePoints[] = devices.map(d => {
    const def = getDevice(d)
    return { deviceId: d, deviceLabel: def.label, points: def.patchPoints }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Metadata */}
      <section className="max-w-xl space-y-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800">
          Patch Info
        </div>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Patch name…"
          required
          className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)…"
          rows={2}
          className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
        />
        <input
          type="text"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
          placeholder="Tags (comma separated): bass, kick, drone…"
          className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        <VisibilityToggle value={isPublic} onChange={setIsPublic} />
      </section>

      {/* Device selector */}
      <section className="max-w-xl">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">
          Devices
        </div>
        <div className="flex gap-4">
          {SUPPORTED_DEVICES.map(d => (
            <label key={d} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={devices.includes(d)}
                onChange={() => toggleDevice(d)}
                className="accent-orange-500"
                aria-label={d}
              />
              <span className="text-sm font-mono text-zinc-300">{d}</span>
            </label>
          ))}
        </div>
      </section>

      {/* One DFAMPanel per selected device */}
      {devices.map(deviceId => (
        <section key={deviceId}>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3 max-w-xl">
            {deviceId} Panel
          </div>
          <DFAMPanel
            values={knobSettings[deviceId] ?? {}}
            onChange={vals => handleKnobChange(deviceId, vals)}
            connections={connections}
            onConnectionsChange={setConnections}
          />
        </section>
      ))}

      {/* Patch Bay — shows jacks from all selected devices */}
      <section className="max-w-xl">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
          Patch Bay
        </div>
        <PatchBay
          devicePoints={devicePoints}
          connections={connections}
          onChange={setConnections}
        />
      </section>

      {/* Notes */}
      <section className="max-w-xl space-y-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800">
          Notes
        </div>
        <textarea
          value={sequenceNotes}
          onChange={e => setSequenceNotes(e.target.value)}
          placeholder="Sequence notes, performance tips…"
          rows={3}
          className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
        />
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800">
          Audio <span className="normal-case text-zinc-700 ml-1">optional</span>
        </div>
        <AudioUpload value={audioUrl} onChange={setAudioUrl} />
      </section>

      {/* Save */}
      <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-zinc-800 -mx-6 px-6 py-4">
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold text-sm px-6 py-2 rounded transition-colors"
        >
          {isSubmitting ? 'Saving…' : 'Save Patch'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Run PatchForm tests**

```bash
npx jest __tests__/components/PatchForm.test.tsx --no-coverage
```

Expected: PASS — all tests pass

- [ ] **Step 5: Commit**

```bash
git add components/patch-form/PatchForm.tsx __tests__/components/PatchForm.test.tsx
git commit -m "feat: add device selector and per-device knob state to PatchForm"
```

---

## Task 9: Update New/Edit Patch Pages and API Submission

**Files:**
- Modify: `app/patches/new/page.tsx`
- Modify: `app/patches/[id]/edit/page.tsx`

> **Context:** These pages load `PatchFormValues` and POST/PUT to the API. The shape changed: `knobSettings` is now `Record<string, Record<string, number>>` and `devices` replaces `device`.

- [ ] **Step 1: Read `app/patches/new/page.tsx`**

```bash
cat app/patches/new/page.tsx
```

- [ ] **Step 2: Update `app/patches/new/page.tsx`**

Find where `PatchFormValues` default is constructed and where the API call serializes knobSettings. Update to new shape. The key changes:

```ts
// Default values — old
const defaultValues: PatchFormValues = {
  name: '', description: '', tags: [],
  knobSettings: {},         // flat Record<string,number>
  connections: [],
  sequenceNotes: '', audioUrl: '', isPublic: false,
}

// Default values — new
const defaultValues: PatchFormValues = {
  name: '', description: '',
  devices: ['DFAM'],
  tags: [],
  knobSettings: { DFAM: {} },  // nested Record<deviceId, Record<knobId, number>>
  connections: [],
  sequenceNotes: '', audioUrl: '', isPublic: false,
}
```

When submitting to `POST /api/patches`, serialize knobSettings as a flat array with device field:

```ts
const knobSettingsFlat = Object.entries(values.knobSettings).flatMap(
  ([deviceId, knobs]) =>
    Object.entries(knobs).map(([knobId, value]) => ({ device: deviceId, knobId, value }))
)

await fetch('/api/patches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...values,
    devices: values.devices,
    knobSettings: knobSettingsFlat,
  }),
})
```

- [ ] **Step 3: Read and update `app/patches/[id]/edit/page.tsx`**

```bash
cat app/patches/\[id\]/edit/page.tsx
```

Same pattern as new page. When loading existing patch for edit, reconstruct nested knobSettings:

```ts
// Reconstruct nested knobSettings from DB flat rows
const knobSettings: Record<string, Record<string, number>> = {}
for (const k of patch.knobSettings) {
  if (!knobSettings[k.device]) knobSettings[k.device] = {}
  knobSettings[k.device][k.knobId] = k.value
}

const defaultValues: PatchFormValues = {
  name: patch.name,
  description: patch.description ?? '',
  devices: patch.devices as Device[],
  tags: patch.tags,
  knobSettings,
  connections: patch.connections.map(c => ({
    fromJack: c.fromJack,
    toJack: c.toJack,
    color: c.color,
  })),
  sequenceNotes: patch.sequenceNotes ?? '',
  audioUrl: patch.audioUrl ?? '',
  isPublic: patch.isPublic,
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/patches/new/page.tsx app/patches/\[id\]/edit/page.tsx
git commit -m "feat: update new/edit pages for multi-device knobSettings shape"
```

---

## Task 10: Update Patch Detail Page

**Files:**
- Modify: `app/patches/[id]/page.tsx`

- [ ] **Step 1: Update `app/patches/[id]/page.tsx`**

Replace the panel + knob table section. The page already uses `DFAMPanelStatic`. Now render one panel per device, and group the knob table by device then section:

```tsx
// Build per-device values and connections
const deviceList = patch.devices as string[]

// values per device
const valuesByDevice: Record<string, Record<string, number>> = {}
for (const k of patch.knobSettings) {
  if (!valuesByDevice[k.device]) valuesByDevice[k.device] = {}
  valuesByDevice[k.device][k.knobId] = k.value
}

// connections (already prefixed)
const connections = patch.connections.map(c => ({
  fromJack: c.fromJack,
  toJack: c.toJack,
  color: c.color,
}))
```

Render panels:

```tsx
{/* One DFAMPanelStatic per device */}
{deviceList.map(deviceId => (
  <div key={deviceId} className="px-6">
    <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3 max-w-3xl mx-auto">
      {deviceId}
    </div>
    <DFAMPanelStatic
      values={valuesByDevice[deviceId] ?? {}}
      connections={connections}
    />
  </div>
))}
```

Knob table: group by device, then by section. Use `DFAM_KNOBS` (same for XFAM):

```tsx
{deviceList.map(deviceId => {
  const devValues = valuesByDevice[deviceId] ?? {}
  return (
    <div key={deviceId} className="max-w-3xl mx-auto px-6">
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
        {deviceId} — Knob Settings
      </div>
      <div className="space-y-6">
        {sections.map(section => {
          const sectionKnobs = DFAM_KNOBS.filter(k => k.section === section && devValues[k.id] !== undefined)
          if (sectionKnobs.length === 0) return null
          return (
            <div key={section}>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
                {SECTION_LABELS[section]}
              </div>
              <table className="w-full text-xs font-mono">
                <tbody>
                  {sectionKnobs.map(knob => (
                    <tr key={knob.id} className="border-b border-zinc-900">
                      <td className="py-1.5 text-zinc-500">{knob.label}</td>
                      <td className="py-1.5 text-right text-orange-400 font-bold">
                        {knob.type === 'switch'
                          ? (knob.options?.[devValues[knob.id]] ?? devValues[knob.id])
                          : devValues[knob.id].toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </div>
  )
})}
```

- [ ] **Step 2: Verify page renders without TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/patches/\[id\]/page.tsx
git commit -m "feat: multi-device panel rendering in patch detail page"
```

---

## Task 11: Update Reseed Script + Run All Tests

**Files:**
- Modify: `scripts/reseed.ts`

- [ ] **Step 1: Update `scripts/reseed.ts` for new schema**

Replace the file:

```ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { prefixJackId } from '../lib/devices'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'daniel.la-corte@proton.me' } })
  if (!user) throw new Error('User not found')

  await prisma.patch.deleteMany({ where: { userId: user.id } })
  console.log('Deleted existing patches')

  const dfam = (j: string) => prefixJackId('DFAM', j)

  await prisma.patch.create({
    data: {
      name: 'Deep Kick',
      devices: ['DFAM'],
      description: 'Classic 808-style kick drum. Long pitch envelope creates deep thump. Velocity routed to VCA for dynamic hits.',
      tags: ['kick', 'bass', 'drum', '808'],
      isPublic: false,
      userId: user.id,
      sequenceNotes: 'Tempo ~5.5. Steps 1+5 at full velocity. Remaining steps low velocity for ghost hits.',
      knobSettings: {
        create: [
          { device: 'DFAM', knobId: 'vco_decay',       value: 8.0 },
          { device: 'DFAM', knobId: 'seq_pitch_mod',   value: 0   },
          { device: 'DFAM', knobId: 'vco1_eg_amount',  value: 9.0 },
          { device: 'DFAM', knobId: 'vco1_freq',       value: 1.5 },
          { device: 'DFAM', knobId: 'fm_1_2_amount',   value: 1.5 },
          { device: 'DFAM', knobId: 'hard_sync',       value: 0   },
          { device: 'DFAM', knobId: 'vco2_eg_amount',  value: 6.0 },
          { device: 'DFAM', knobId: 'vco2_freq',       value: 1.5 },
          { device: 'DFAM', knobId: 'vco1_wave',       value: 0   },
          { device: 'DFAM', knobId: 'vco1_level',      value: 8.5 },
          { device: 'DFAM', knobId: 'noise_ext_level', value: 1.0 },
          { device: 'DFAM', knobId: 'vco2_wave',       value: 0   },
          { device: 'DFAM', knobId: 'vco2_level',      value: 7.0 },
          { device: 'DFAM', knobId: 'vcf_mode',        value: 1   },
          { device: 'DFAM', knobId: 'vcf_cutoff',      value: 5.5 },
          { device: 'DFAM', knobId: 'vcf_resonance',   value: 2.0 },
          { device: 'DFAM', knobId: 'vcf_decay',       value: 5.0 },
          { device: 'DFAM', knobId: 'vcf_eg_amount',   value: 3.0 },
          { device: 'DFAM', knobId: 'vca_eg',          value: 0   },
          { device: 'DFAM', knobId: 'volume',          value: 8.0 },
          { device: 'DFAM', knobId: 'noise_vcf_mod',   value: 0   },
          { device: 'DFAM', knobId: 'vca_decay',       value: 6.5 },
          { device: 'DFAM', knobId: 'tempo',           value: 5.5 },
          { device: 'DFAM', knobId: 'seq_1_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_1_vel', value: 10.0 },
          { device: 'DFAM', knobId: 'seq_2_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_2_vel', value: 2.0  },
          { device: 'DFAM', knobId: 'seq_3_pitch', value: 2.5 }, { device: 'DFAM', knobId: 'seq_3_vel', value: 3.5  },
          { device: 'DFAM', knobId: 'seq_4_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_4_vel', value: 2.0  },
          { device: 'DFAM', knobId: 'seq_5_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_5_vel', value: 10.0 },
          { device: 'DFAM', knobId: 'seq_6_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_6_vel', value: 2.0  },
          { device: 'DFAM', knobId: 'seq_7_pitch', value: 2.5 }, { device: 'DFAM', knobId: 'seq_7_vel', value: 3.0  },
          { device: 'DFAM', knobId: 'seq_8_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_8_vel', value: 2.0  },
        ],
      },
      connections: {
        create: [
          { fromJack: dfam('velocity_cv_out'), toJack: dfam('vca_cv_in'),   color: 'orange' },
          { fromJack: dfam('velocity_cv_out'), toJack: dfam('vco1_cv_in'),  color: 'blue'   },
          { fromJack: dfam('pitch_out'),       toJack: dfam('vco2_cv_in'),  color: 'green'  },
        ],
      },
    },
  })
  console.log('Created: Deep Kick')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run reseed**

```bash
DATABASE_URL="postgresql://patchlib_admin:REDACTED@patchlib-aurora.cluster-cudka60y023m.us-east-1.rds.amazonaws.com:5432/patchlib" npx tsx scripts/reseed.ts
```

Expected:
```
Deleted existing patches
Created: Deep Kick
```

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage 2>&1 | tail -20
```

Expected: all tests pass except the pre-existing middleware test failure (unrelated).

- [ ] **Step 4: Commit**

```bash
git add scripts/reseed.ts
git commit -m "feat: update reseed for multi-device schema with prefixed jack IDs"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `lib/devices.ts` — Task 1
- ✅ `lib/types.ts` updated — Task 2
- ✅ `Patch.devices[]`, `KnobSetting.device`, drop `Patch.device` — Tasks 3, 4, 5
- ✅ API routes updated — Task 6
- ✅ PatchBay multi-device + prefixed IDs — Task 7
- ✅ PatchForm device selector — Task 8
- ✅ New/Edit pages updated — Task 9
- ✅ Detail page multi-panel — Task 10
- ✅ Reseed updated — Task 11
- ✅ Data migration (backfill + prefix) — Task 4
- ✅ XFAM defined (reuses DFAM definitions) — Task 1

**Type consistency check:**
- `prefixJackId(deviceId, jackId)` used consistently in Task 7 (PatchBay), Task 11 (reseed)
- `parseJackId` used in PatchBay cable list label resolution
- `DevicePoints` exported from PatchBay, imported in PatchForm — consistent
- `knobSettings: Record<string, Record<string, number>>` used in PatchForm, new/edit pages, detail page — consistent
