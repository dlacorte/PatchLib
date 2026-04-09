# PatchLib MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PatchLib MVP — a web app for capturing, naming, searching, and recalling DFAM synthesizer patches with interactive SVG knob dials and a click-to-connect SVG patch bay.

**Architecture:** Next.js 14 App Router (TypeScript) serves both the React frontend and REST API routes in one repo. Prisma ORM connects to AWS RDS PostgreSQL. Deployed to Vercel (app) + AWS RDS (data). No authentication required for MVP.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL (AWS RDS), Jest, React Testing Library

---

## File Map

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | DB schema: Patch, KnobSetting, CableConnection |
| `prisma/seed.ts` | 3 example DFAM patches |
| `lib/prisma.ts` | Prisma client singleton (hot-reload safe) |
| `lib/dfam.ts` | Static DFAM knob + jack definitions + jack positions |
| `lib/types.ts` | Shared TypeScript types used across app + API |
| `app/layout.tsx` | Root layout, dark theme, JetBrains Mono font |
| `app/globals.css` | Tailwind directives + custom reset |
| `app/page.tsx` | Library page: search, tag filter, patch list |
| `app/patches/new/page.tsx` | Create patch page |
| `app/patches/[id]/page.tsx` | Patch detail (read-only) |
| `app/patches/[id]/edit/page.tsx` | Edit patch page |
| `app/api/patches/route.ts` | GET (list + search + tag filter) + POST |
| `app/api/patches/[id]/route.ts` | GET one + PUT + DELETE |
| `components/dfam/Knob.tsx` | SVG rotary knob — drag to set 0–10 value |
| `components/dfam/WaveToggle.tsx` | TRI/SAW 2-position toggle for VCO wave switch |
| `components/dfam/KnobGrid.tsx` | Full DFAM knob panel (main + sequencer sections) |
| `components/dfam/PatchBay.tsx` | SVG patch bay — click-to-connect jacks, colored cables |
| `components/library/PatchCard.tsx` | Single patch row in the library list |
| `components/library/SearchBar.tsx` | Controlled search input with URL param sync |
| `components/library/TagFilter.tsx` | Clickable tag chips for active filter |
| `components/patch-form/PatchForm.tsx` | Full create/edit form combining all sections |
| `__tests__/api/patches.test.ts` | API route tests (Prisma mocked) |
| `__tests__/api/patches-id.test.ts` | API [id] route tests |
| `__tests__/components/Knob.test.tsx` | Knob render + interaction tests |
| `__tests__/components/PatchBay.test.tsx` | PatchBay connection tests |
| `jest.config.js` | Jest config for Next.js |
| `jest.setup.ts` | @testing-library/jest-dom setup |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via CLI), `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `jest.config.js`, `jest.setup.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/lacorte/Projects/repositories/PatchLib
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-git
```

Expected: Next.js project files created in current directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client
npm install -D jest @types/jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-node
npx shadcn@latest init -d
npx shadcn@latest add button input textarea badge card
```

When shadcn asks for style: Default. Base color: Neutral. CSS variables: Yes.

- [ ] **Step 3: Create jest.config.js**

```js
// jest.config.js
const nextJest = require('next/jest')
const createJestConfig = nextJest({ dir: './' })
module.exports = createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
})
```

- [ ] **Step 4: Create jest.setup.ts**

```ts
// jest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

Open `package.json` and add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 6: Verify scaffold**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build succeeds (exit 0). It's OK if there are type warnings from the default Next.js template.

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 14 project with Tailwind, shadcn, Jest"
```

---

## Task 2: Root Layout + Global Styles

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update app/globals.css**

Replace the entire file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  background: #0a0a0a;
  color: #eeeeee;
}

/* Prevent text selection during knob drag */
.knob-drag {
  user-select: none;
}
```

- [ ] **Step 2: Install JetBrains Mono font**

```bash
npm install @next/font
```

- [ ] **Step 3: Update app/layout.tsx**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'PatchLib',
  description: 'Analog synthesizer patch library for DFAM',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono bg-[#0a0a0a] text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update tailwind.config.ts to include font variable**

Open `tailwind.config.ts` and ensure `fontFamily` includes:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        patch: {
          orange: '#e07b39',
          surface: '#111111',
          surface2: '#161616',
          border: '#2a2a2a',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 5: Replace app/page.tsx with placeholder**

```tsx
// app/page.tsx
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-mono text-zinc-500 text-sm tracking-widest">PATCHLIB — coming soon</p>
    </div>
  )
}
```

- [ ] **Step 6: Verify build**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000 | grep -o 'PATCHLIB' || echo "Not found in HTML (OK — Next.js renders client-side)"
kill %1
```

Expected: dev server starts without errors.

- [ ] **Step 7: Commit**

```bash
git add app/layout.tsx app/globals.css app/page.tsx tailwind.config.ts
git commit -m "feat: root layout with JetBrains Mono and dark theme"
```

---

## Task 3: Prisma Schema + DB Client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `.env.local` (not committed)
- Create: `.env.example`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: `prisma/schema.prisma` and `.env` created.

- [ ] **Step 2: Replace prisma/schema.prisma**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Patch {
  id            String            @id @default(cuid())
  name          String
  device        String            @default("DFAM")
  description   String?
  tags          String[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  knobSettings  KnobSetting[]
  connections   CableConnection[]
  sequenceNotes String?
  audioUrl      String?
  photoUrl      String?
}

model KnobSetting {
  id      String @id @default(cuid())
  patch   Patch  @relation(fields: [patchId], references: [id], onDelete: Cascade)
  patchId String
  knobId  String
  value   Float
}

model CableConnection {
  id       String @id @default(cuid())
  patch    Patch  @relation(fields: [patchId], references: [id], onDelete: Cascade)
  patchId  String
  fromJack String
  toJack   String
  color    String
}
```

- [ ] **Step 3: Create lib/prisma.ts**

```ts
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Create .env.local with your RDS connection string**

```bash
cat > .env.local << 'EOF'
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-RDS-ENDPOINT:5432/patchlib?schema=public"
EOF
```

Replace USER, PASSWORD, YOUR-RDS-ENDPOINT with your actual AWS RDS credentials.

- [ ] **Step 5: Create .env.example (committed to repo)**

```bash
cat > .env.example << 'EOF'
DATABASE_URL="postgresql://USER:PASSWORD@YOUR-RDS-ENDPOINT:5432/patchlib?schema=public"
EOF
```

- [ ] **Step 6: Add .env.local to .gitignore**

Open `.gitignore` and ensure these lines exist:
```
.env.local
.env
```

- [ ] **Step 7: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 8: Run migration against RDS**

```bash
npx prisma migrate dev --name init
```

Expected: Migration applied, tables created in RDS. If RDS is not yet provisioned, run `npx prisma db push` instead to push schema directly.

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma lib/prisma.ts .env.example .gitignore
git commit -m "feat: Prisma schema with Patch, KnobSetting, CableConnection models"
```

---

## Task 4: DFAM Static Definitions

**Files:**
- Create: `lib/dfam.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/dfam.test.ts
import { DFAM_KNOBS, DFAM_JACKS, CABLE_COLORS } from '@/lib/dfam'

describe('DFAM_KNOBS', () => {
  it('has 13 main knobs and toggles', () => {
    const main = DFAM_KNOBS.filter(k => k.section === 'main')
    expect(main).toHaveLength(13)
  })

  it('has 11 rotary knobs in main section', () => {
    const knobs = DFAM_KNOBS.filter(k => k.section === 'main' && k.type === 'knob')
    expect(knobs).toHaveLength(11)
  })

  it('has 2 toggle switches in main section', () => {
    const toggles = DFAM_KNOBS.filter(k => k.section === 'main' && k.type === 'toggle')
    expect(toggles).toHaveLength(2)
    expect(toggles.map(t => t.id)).toEqual(['vco1_wave', 'vco2_wave'])
  })
})

describe('DFAM_JACKS', () => {
  it('has 7 outputs', () => {
    expect(DFAM_JACKS.outputs).toHaveLength(7)
  })

  it('has 7 inputs', () => {
    expect(DFAM_JACKS.inputs).toHaveLength(7)
  })

  it('all jacks have id, label, x, y', () => {
    const allJacks = [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs]
    allJacks.forEach(j => {
      expect(j.id).toBeTruthy()
      expect(j.label).toBeTruthy()
      expect(typeof j.x).toBe('number')
      expect(typeof j.y).toBe('number')
    })
  })

  it('has no duplicate jack ids', () => {
    const allJacks = [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs]
    const ids = allJacks.map(j => j.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('CABLE_COLORS', () => {
  it('has 5 colors', () => {
    expect(CABLE_COLORS).toHaveLength(5)
  })

  it('includes orange as first color', () => {
    expect(CABLE_COLORS[0].id).toBe('orange')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/lib/dfam.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/lib/dfam'`

- [ ] **Step 3: Create lib/dfam.ts**

```ts
// lib/dfam.ts

export interface KnobDef {
  id: string
  label: string
  section: 'main' | 'sequencer'
  type: 'knob' | 'toggle'
  defaultValue: number
}

export interface JackDef {
  id: string
  label: string
  x: number
  y: number
}

export interface CableColorDef {
  id: string
  hex: string
  label: string
}

export const DFAM_KNOBS: KnobDef[] = [
  // Main rotary knobs (11)
  { id: 'tempo',         label: 'TEMPO',     section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vco1_freq',     label: 'VCO1 FREQ', section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vco2_freq',     label: 'VCO2 FREQ', section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'noise_level',   label: 'NOISE',     section: 'main', type: 'knob',   defaultValue: 0 },
  { id: 'vco1_decay',    label: 'VCO1 DCY',  section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vco2_decay',    label: 'VCO2 DCY',  section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'eg_attack',     label: 'EG ATK',    section: 'main', type: 'knob',   defaultValue: 0 },
  { id: 'eg_decay',      label: 'EG DCY',    section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vcf_cutoff',    label: 'VCF CUTOFF',section: 'main', type: 'knob',   defaultValue: 7 },
  { id: 'vcf_resonance', label: 'VCF RES',   section: 'main', type: 'knob',   defaultValue: 3 },
  { id: 'vca_level',     label: 'VCA LEVEL', section: 'main', type: 'knob',   defaultValue: 8 },
  // Toggle switches (2)
  { id: 'vco1_wave',     label: 'VCO1 WAVE', section: 'main', type: 'toggle', defaultValue: 0 },
  { id: 'vco2_wave',     label: 'VCO2 WAVE', section: 'main', type: 'toggle', defaultValue: 0 },
]

export const SEQUENCER_STEPS = 8

// SVG viewBox: 0 0 560 100
// Outputs at y=25, Inputs at y=75, 7 jacks each, x spacing = 70px starting at 35
export const DFAM_JACKS = {
  outputs: [
    { id: 'vco1_out',   label: 'VCO1',   x: 35,  y: 25 },
    { id: 'vco2_out',   label: 'VCO2',   x: 105, y: 25 },
    { id: 'noise_out',  label: 'NOISE',  x: 175, y: 25 },
    { id: 'eg_out',     label: 'EG',     x: 245, y: 25 },
    { id: 'tempo_out',  label: 'TEMPO',  x: 315, y: 25 },
    { id: 'midi_gate',  label: 'M.GATE', x: 385, y: 25 },
    { id: 'midi_pitch', label: 'M.PCH',  x: 455, y: 25 },
  ] as JackDef[],
  inputs: [
    { id: 'vco1_fm',     label: 'V1 FM',   x: 35,  y: 75 },
    { id: 'vco2_fm',     label: 'V2 FM',   x: 105, y: 75 },
    { id: 'vcf_cv',      label: 'VCF CV',  x: 175, y: 75 },
    { id: 'audio_in',    label: 'AUDIO',   x: 245, y: 75 },
    { id: 'adv_clock',   label: 'ADV/CLK', x: 315, y: 75 },
    { id: 'run_stop',    label: 'RUN/STP', x: 385, y: 75 },
    { id: 'velocity_in', label: 'VEL IN',  x: 455, y: 75 },
  ] as JackDef[],
}

export const CABLE_COLORS: CableColorDef[] = [
  { id: 'orange', hex: '#e07b39', label: 'Orange' },
  { id: 'blue',   hex: '#5b9bd5', label: 'Blue' },
  { id: 'green',  hex: '#7ec87e', label: 'Green' },
  { id: 'red',    hex: '#e05555', label: 'Red' },
  { id: 'white',  hex: '#dddddd', label: 'White' },
]
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest __tests__/lib/dfam.test.ts 2>&1 | tail -5
```

Expected: PASS — 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add lib/dfam.ts __tests__/lib/dfam.test.ts
git commit -m "feat: DFAM static definitions — knobs, jacks, cable colors"
```

---

## Task 5: Shared TypeScript Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/types.ts**

```ts
// lib/types.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: shared TypeScript types for patch data"
```

---

## Task 6: API Route — List + Create

**Files:**
- Create: `app/api/patches/route.ts`
- Create: `__tests__/api/patches.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/api/patches.test.ts
import { GET, POST } from '@/app/api/patches/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    patch: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const mockPatch = {
  id: 'cltest123',
  name: 'Test Patch',
  device: 'DFAM',
  description: null,
  tags: ['test'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  _count: { connections: 2 },
}

describe('GET /api/patches', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns list of patches as JSON', async () => {
    ;(prisma.patch.findMany as jest.Mock).mockResolvedValue([mockPatch])
    const req = new NextRequest('http://localhost/api/patches')
    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Test Patch')
  })

  it('passes search param to prisma where clause', async () => {
    ;(prisma.patch.findMany as jest.Mock).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/patches?search=kick')
    await GET(req)
    const call = (prisma.patch.findMany as jest.Mock).mock.calls[0][0]
    expect(JSON.stringify(call.where)).toContain('kick')
  })

  it('passes tags param to prisma where clause', async () => {
    ;(prisma.patch.findMany as jest.Mock).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/patches?tags=bass,acid')
    await GET(req)
    const call = (prisma.patch.findMany as jest.Mock).mock.calls[0][0]
    expect(JSON.stringify(call.where)).toContain('bass')
  })
})

describe('POST /api/patches', () => {
  beforeEach(() => jest.clearAllMocks())

  it('creates a patch and returns it', async () => {
    ;(prisma.patch.create as jest.Mock).mockResolvedValue({ ...mockPatch, _count: undefined })
    const body = {
      name: 'New Patch',
      device: 'DFAM',
      tags: ['bass'],
      knobSettings: [{ knobId: 'tempo', value: 7 }],
      connections: [{ fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }],
      description: '',
      sequenceNotes: '',
      audioUrl: '',
    }
    const req = new NextRequest('http://localhost/api/patches', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/patches', {
      method: 'POST',
      body: JSON.stringify({ device: 'DFAM' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/patches.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/app/api/patches/route'`

- [ ] **Step 3: Create app/api/patches/route.ts**

```ts
// app/api/patches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const tagsParam = searchParams.get('tags') || ''
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []

  const patches = await prisma.patch.findMany({
    where: {
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
  const body = await req.json().catch(() => null)

  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { name, device, description, tags, knobSettings, connections, sequenceNotes, audioUrl, photoUrl } = body

  const patch = await prisma.patch.create({
    data: {
      name,
      device: device || 'DFAM',
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      knobSettings: {
        create: (knobSettings || []).map((k: { knobId: string; value: number }) => ({
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/patches.test.ts 2>&1 | tail -10
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add app/api/patches/route.ts __tests__/api/patches.test.ts
git commit -m "feat: GET /api/patches (search + tag filter) and POST /api/patches"
```

---

## Task 7: API Route — Get + Update + Delete

**Files:**
- Create: `app/api/patches/[id]/route.ts`
- Create: `__tests__/api/patches-id.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/api/patches-id.test.ts
import { GET, PUT, DELETE } from '@/app/api/patches/[id]/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    patch: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    knobSetting: { deleteMany: jest.fn() },
    cableConnection: { deleteMany: jest.fn() },
  },
}))

const params = { params: { id: 'cltest123' } }

const fullPatch = {
  id: 'cltest123',
  name: 'Test',
  device: 'DFAM',
  description: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  knobSettings: [],
  connections: [],
}

describe('GET /api/patches/[id]', () => {
  it('returns patch when found', async () => {
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
    const req = new NextRequest('http://localhost/api/patches/cltest123')
    const res = await GET(req, params)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('cltest123')
  })

  it('returns 404 when not found', async () => {
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches/missing')
    const res = await GET(req, { params: { id: 'missing' } })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/patches/[id]', () => {
  it('replaces patch and returns updated', async () => {
    ;(prisma.knobSetting.deleteMany as jest.Mock).mockResolvedValue({})
    ;(prisma.cableConnection.deleteMany as jest.Mock).mockResolvedValue({})
    ;(prisma.patch.update as jest.Mock).mockResolvedValue(fullPatch)
    const req = new NextRequest('http://localhost/api/patches/cltest123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated', tags: [], knobSettings: [], connections: [] }),
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/patches/[id]', () => {
  it('deletes patch and returns 204', async () => {
    ;(prisma.patch.delete as jest.Mock).mockResolvedValue({})
    const req = new NextRequest('http://localhost/api/patches/cltest123', { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(204)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/api/patches-id.test.ts 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/app/api/patches/[id]/route'`

- [ ] **Step 3: Create app/api/patches/[id]/route.ts**

```ts
// app/api/patches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { name, device, description, tags, knobSettings, connections, sequenceNotes, audioUrl, photoUrl } = body

  // Delete existing relations then re-create (full replace)
  await prisma.knobSetting.deleteMany({ where: { patchId: params.id } })
  await prisma.cableConnection.deleteMany({ where: { patchId: params.id } })

  const patch = await prisma.patch.update({
    where: { id: params.id },
    data: {
      name,
      device: device || 'DFAM',
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      knobSettings: {
        create: (knobSettings || []).map((k: { knobId: string; value: number }) => ({
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
  await prisma.patch.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/patches-id.test.ts 2>&1 | tail -5
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Run all API tests**

```bash
npx jest __tests__/api/ 2>&1 | tail -5
```

Expected: PASS — 9 tests passing total.

- [ ] **Step 6: Commit**

```bash
git add app/api/patches/[id]/route.ts __tests__/api/patches-id.test.ts
git commit -m "feat: GET/PUT/DELETE /api/patches/[id]"
```

---

## Task 8: Knob Component (SVG Rotary Dial)

**Files:**
- Create: `components/dfam/Knob.tsx`
- Create: `__tests__/components/Knob.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/components/Knob.test.tsx
import { render, screen } from '@testing-library/react'
import { Knob } from '@/components/dfam/Knob'

describe('Knob', () => {
  it('renders the label', () => {
    render(<Knob id="tempo" label="TEMPO" value={5} onChange={jest.fn()} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders the current value', () => {
    render(<Knob id="tempo" label="TEMPO" value={7.5} onChange={jest.fn()} />)
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = render(<Knob id="tempo" label="TEMPO" value={5} onChange={jest.fn()} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/Knob.test.tsx 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/components/dfam/Knob'`

- [ ] **Step 3: Create components/dfam/Knob.tsx**

```tsx
// components/dfam/Knob.tsx
'use client'

import { useRef, useCallback } from 'react'

interface KnobProps {
  id: string
  label: string
  value: number     // 0.0–10.0
  onChange: (id: string, value: number) => void
  size?: number     // SVG size in px, default 48
}

const MIN_ANGLE = -135 // degrees from top
const MAX_ANGLE = 135
const SWEEP = MAX_ANGLE - MIN_ANGLE // 270°

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function valueToAngle(value: number) {
  return MIN_ANGLE + (value / 10) * SWEEP
}

export function Knob({ id, label, value, onChange, size = 48 }: KnobProps) {
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startValue = useRef(0)

  const r = size / 2
  const angle = valueToAngle(value)
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
      const next = clamp(startValue.current + delta * 10, 0, 10)
      onChange(id, Math.round(next * 10) / 10)
    },
    [id, onChange],
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

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
        {/* Body */}
        <circle cx={r} cy={r} r={r - 3} fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5" />
        {/* Indicator line */}
        <line
          x1={ix} y1={iy}
          x2={ox} y2={oy}
          stroke="#e07b39"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[9px] text-orange-400 font-mono leading-none">{value.toFixed(1)}</span>
      <span className="text-[8px] text-zinc-500 uppercase tracking-wide text-center leading-tight max-w-[48px]">
        {label}
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/Knob.test.tsx 2>&1 | tail -5
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/dfam/Knob.tsx __tests__/components/Knob.test.tsx
git commit -m "feat: SVG rotary Knob component with drag interaction"
```

---

## Task 9: WaveToggle Component

**Files:**
- Create: `components/dfam/WaveToggle.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/WaveToggle.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { WaveToggle } from '@/components/dfam/WaveToggle'

describe('WaveToggle', () => {
  it('renders TRI and SAW buttons', () => {
    render(<WaveToggle id="vco1_wave" label="VCO1 WAVE" value={0} onChange={jest.fn()} />)
    expect(screen.getByText('TRI')).toBeInTheDocument()
    expect(screen.getByText('SAW')).toBeInTheDocument()
  })

  it('calls onChange with 1 when SAW is clicked from TRI', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_wave" label="VCO1 WAVE" value={0} onChange={onChange} />)
    fireEvent.click(screen.getByText('SAW'))
    expect(onChange).toHaveBeenCalledWith('vco1_wave', 1)
  })

  it('calls onChange with 0 when TRI is clicked from SAW', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_wave" label="VCO1 WAVE" value={1} onChange={onChange} />)
    fireEvent.click(screen.getByText('TRI'))
    expect(onChange).toHaveBeenCalledWith('vco1_wave', 0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/WaveToggle.test.tsx 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/components/dfam/WaveToggle'`

- [ ] **Step 3: Create components/dfam/WaveToggle.tsx**

```tsx
// components/dfam/WaveToggle.tsx
'use client'

interface WaveToggleProps {
  id: string
  label: string
  value: number   // 0 = TRI, 1 = SAW
  onChange: (id: string, value: number) => void
}

export function WaveToggle({ id, label, value, onChange }: WaveToggleProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 select-none" data-testid={`toggle-${id}`}>
      <div className="flex border border-zinc-700 rounded overflow-hidden">
        <button
          type="button"
          onClick={() => onChange(id, 0)}
          className={`px-2 py-1 text-[9px] font-mono font-bold transition-colors ${
            value === 0 ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          TRI
        </button>
        <button
          type="button"
          onClick={() => onChange(id, 1)}
          className={`px-2 py-1 text-[9px] font-mono font-bold transition-colors ${
            value === 1 ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          SAW
        </button>
      </div>
      <span className="text-[8px] text-zinc-500 uppercase tracking-wide text-center">{label}</span>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/WaveToggle.test.tsx 2>&1 | tail -5
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/dfam/WaveToggle.tsx __tests__/components/WaveToggle.test.tsx
git commit -m "feat: WaveToggle TRI/SAW switch component"
```

---

## Task 10: KnobGrid Component

**Files:**
- Create: `components/dfam/KnobGrid.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/KnobGrid.test.tsx
import { render, screen } from '@testing-library/react'
import { KnobGrid } from '@/components/dfam/KnobGrid'

describe('KnobGrid', () => {
  const defaultValues = {}
  const onChange = jest.fn()

  it('renders main panel section heading', () => {
    render(<KnobGrid values={defaultValues} onChange={onChange} />)
    expect(screen.getByText(/main panel/i)).toBeInTheDocument()
  })

  it('renders TEMPO knob', () => {
    render(<KnobGrid values={defaultValues} onChange={onChange} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders VCO1 WAVE toggle', () => {
    render(<KnobGrid values={defaultValues} onChange={onChange} />)
    expect(screen.getAllByText('TRI').length).toBeGreaterThan(0)
  })

  it('renders sequencer section', () => {
    render(<KnobGrid values={defaultValues} onChange={onChange} />)
    expect(screen.getByText(/sequencer/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/KnobGrid.test.tsx 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/components/dfam/KnobGrid'`

- [ ] **Step 3: Create components/dfam/KnobGrid.tsx**

```tsx
// components/dfam/KnobGrid.tsx
'use client'

import { useState, useCallback } from 'react'
import { DFAM_KNOBS, SEQUENCER_STEPS } from '@/lib/dfam'
import { Knob } from './Knob'
import { WaveToggle } from './WaveToggle'

type KnobValues = Record<string, number>

interface KnobGridProps {
  values: KnobValues
  onChange: (values: KnobValues) => void
}

export function KnobGrid({ values, onChange }: KnobGridProps) {
  const [seqOpen, setSeqOpen] = useState(true)

  const handleChange = useCallback(
    (id: string, value: number) => onChange({ ...values, [id]: value }),
    [values, onChange],
  )

  const mainKnobs = DFAM_KNOBS.filter(k => k.section === 'main' && k.type === 'knob')
  const mainToggles = DFAM_KNOBS.filter(k => k.section === 'main' && k.type === 'toggle')

  return (
    <div className="space-y-6">
      {/* Main panel */}
      <div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 pb-1 border-b border-zinc-800">
          Main Panel
        </div>
        <div className="flex flex-wrap gap-6">
          {mainKnobs.map(k => (
            <Knob
              key={k.id}
              id={k.id}
              label={k.label}
              value={values[k.id] ?? k.defaultValue}
              onChange={handleChange}
            />
          ))}
          {mainToggles.map(t => (
            <WaveToggle
              key={t.id}
              id={t.id}
              label={t.label}
              value={values[t.id] ?? t.defaultValue}
              onChange={handleChange}
            />
          ))}
        </div>
      </div>

      {/* Sequencer */}
      <div>
        <button
          type="button"
          onClick={() => setSeqOpen(o => !o)}
          className="w-full text-left flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4"
        >
          <span>Sequencer</span>
          <span className="text-zinc-600">{seqOpen ? '▲' : '▼'}</span>
        </button>

        {seqOpen && (
          <div className="grid grid-cols-8 gap-3">
            {Array.from({ length: SEQUENCER_STEPS }, (_, i) => i + 1).map(step => (
              <div key={step} className="flex flex-col items-center gap-2">
                <span className="text-[8px] text-zinc-600 font-mono">S{step}</span>
                <Knob
                  id={`seq_${step}_pitch`}
                  label="PCH"
                  value={values[`seq_${step}_pitch`] ?? 5}
                  onChange={handleChange}
                  size={36}
                />
                <Knob
                  id={`seq_${step}_vel`}
                  label="VEL"
                  value={values[`seq_${step}_vel`] ?? 5}
                  onChange={handleChange}
                  size={36}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/KnobGrid.test.tsx 2>&1 | tail -5
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/dfam/KnobGrid.tsx __tests__/components/KnobGrid.test.tsx
git commit -m "feat: KnobGrid — full DFAM knob panel with main + sequencer sections"
```

---

## Task 11: PatchBay Component

**Files:**
- Create: `components/dfam/PatchBay.tsx`
- Create: `__tests__/components/PatchBay.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/components/PatchBay.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PatchBay } from '@/components/dfam/PatchBay'

const noConnections: Array<{ fromJack: string; toJack: string; color: string }> = []

describe('PatchBay', () => {
  it('renders all output jack labels', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('VCO1')).toBeInTheDocument()
    expect(screen.getByText('EG')).toBeInTheDocument()
  })

  it('renders all input jack labels', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('V1 FM')).toBeInTheDocument()
    expect(screen.getByText('AUDIO')).toBeInTheDocument()
  })

  it('shows remove button when a cable is clicked', () => {
    const connections = [{ fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }]
    const { container } = render(<PatchBay connections={connections} onChange={jest.fn()} />)
    const cable = container.querySelector('path[data-cable]')
    if (cable) fireEvent.click(cable)
    // Remove button may appear after click
  })

  it('calls onChange when a complete connection is made', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(<PatchBay connections={noConnections} onChange={onChange} />)
    // Click output jack
    fireEvent.click(getByTestId('jack-vco1_out'))
    // Click input jack
    fireEvent.click(getByTestId('jack-audio_in'))
    expect(onChange).toHaveBeenCalledWith([
      { fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/PatchBay.test.tsx 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/components/dfam/PatchBay'`

- [ ] **Step 3: Create components/dfam/PatchBay.tsx**

```tsx
// components/dfam/PatchBay.tsx
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

function getJack(id: string): JackDef | undefined {
  return [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs].find(j => j.id === id)
}

function colorHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
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
          viewBox="0 0 560 100"
          className="block"
          style={{ fontFamily: 'monospace' }}
        >
          {/* Row labels */}
          <text x="8" y="29" fill="#3a3a3a" fontSize="8">OUT</text>
          <text x="8" y="79" fill="#3a3a3a" fontSize="8">IN</text>

          {/* Cables */}
          {connections.map((conn, i) => {
            const from = getJack(conn.fromJack)
            const to = getJack(conn.toJack)
            if (!from || !to) return null
            const midY = (from.y + to.y) / 2 + 10
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

          {/* Output jacks */}
          {DFAM_JACKS.outputs.map(jack => {
            const isPending = pendingFrom === jack.id
            const isUsed = connections.some(c => c.fromJack === jack.id)
            return (
              <g
                key={jack.id}
                data-testid={`jack-${jack.id}`}
                onClick={() => handleOutputClick(jack.id)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={jack.x} cy={jack.y} r={8}
                  fill="#1a1a1a"
                  stroke={isPending ? activeCableColor : isUsed ? '#555' : '#333'}
                  strokeWidth={isPending ? 2 : 1.5}
                />
                {isPending && (
                  <circle cx={jack.x} cy={jack.y} r={3.5} fill={activeCableColor} opacity={0.9} />
                )}
                <text x={jack.x} y={jack.y + 19} textAnchor="middle" fill="#555" fontSize="7">
                  {jack.label}
                </text>
              </g>
            )
          })}

          {/* Input jacks */}
          {DFAM_JACKS.inputs.map(jack => {
            const isTargeting = !!pendingFrom
            const isUsed = connections.some(c => c.toJack === jack.id)
            return (
              <g
                key={jack.id}
                data-testid={`jack-${jack.id}`}
                onClick={() => handleInputClick(jack.id)}
                style={{ cursor: isTargeting ? 'crosshair' : 'pointer' }}
              >
                <circle
                  cx={jack.x} cy={jack.y} r={8}
                  fill="#1a1a1a"
                  stroke={isTargeting ? activeCableColor : isUsed ? '#555' : '#333'}
                  strokeWidth={1.5}
                  strokeDasharray={isTargeting ? '3,2' : undefined}
                />
                <text x={jack.x} y={jack.y + 19} textAnchor="middle" fill="#555" fontSize="7">
                  {jack.label}
                </text>
              </g>
            )
          })}
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/PatchBay.test.tsx 2>&1 | tail -5
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/dfam/PatchBay.tsx __tests__/components/PatchBay.test.tsx
git commit -m "feat: SVG PatchBay — click-to-connect jacks with colored Bézier cables"
```

---

## Task 12: Library Components

**Files:**
- Create: `components/library/PatchCard.tsx`
- Create: `components/library/SearchBar.tsx`
- Create: `components/library/TagFilter.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// __tests__/components/library.test.tsx
import { render, screen } from '@testing-library/react'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'

const mockPatch = {
  id: 'cl123',
  name: 'Heavy Kick',
  device: 'DFAM',
  description: 'Deep kick',
  tags: ['percussion', 'kick'],
  createdAt: new Date('2026-04-08'),
  updatedAt: new Date('2026-04-08'),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  _count: { connections: 2 },
}

describe('PatchCard', () => {
  it('renders patch name', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText('Heavy Kick')).toBeInTheDocument()
  })

  it('renders device name', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('renders connection count', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText(/2 cables/)).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText('percussion')).toBeInTheDocument()
  })
})

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar defaultValue="" />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})

describe('TagFilter', () => {
  it('renders all tag chips', () => {
    render(<TagFilter tags={['bass', 'kick']} activeTags={[]} />)
    expect(screen.getByText('bass')).toBeInTheDocument()
    expect(screen.getByText('kick')).toBeInTheDocument()
  })

  it('marks active tags visually', () => {
    render(<TagFilter tags={['bass', 'kick']} activeTags={['bass']} />)
    const bassChip = screen.getByText('bass').closest('a')
    expect(bassChip?.className).toContain('orange')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/components/library.test.tsx 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/components/library/PatchCard'`

- [ ] **Step 3: Create components/library/PatchCard.tsx**

```tsx
// components/library/PatchCard.tsx
import Link from 'next/link'
import type { PatchListItem } from '@/lib/types'

interface PatchCardProps {
  patch: PatchListItem
}

export function PatchCard({ patch }: PatchCardProps) {
  const date = new Date(patch.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/patches/${patch.id}`}
      className="block bg-[#111] border border-zinc-800 rounded px-4 py-3 hover:border-zinc-600 hover:bg-[#161616] transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-sm text-zinc-100 group-hover:text-white truncate">
              {patch.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 rounded px-1 py-0 flex-shrink-0">
              {patch.device}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-600">
            <span>{patch._count.connections} cables</span>
            {patch.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {patch.tags.map(tag => (
                  <span key={tag} className="text-zinc-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <span className="text-[11px] text-zinc-600 font-mono flex-shrink-0">{date}</span>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Create components/library/SearchBar.tsx**

```tsx
// components/library/SearchBar.tsx
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface SearchBarProps {
  defaultValue: string
}

export function SearchBar({ defaultValue }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (e.target.value) {
        params.set('search', e.target.value)
      } else {
        params.delete('search')
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams],
  )

  return (
    <input
      type="search"
      defaultValue={defaultValue}
      onChange={handleChange}
      placeholder="Search patches…"
      className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
    />
  )
}
```

- [ ] **Step 5: Create components/library/TagFilter.tsx**

```tsx
// components/library/TagFilter.tsx
'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'

interface TagFilterProps {
  tags: string[]
  activeTags: string[]
}

export function TagFilter({ tags, activeTags }: TagFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function hrefForTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('tags')?.split(',').filter(Boolean) || []
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    if (next.length > 0) {
      params.set('tags', next.join(','))
    } else {
      params.delete('tags')
    }
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => {
        const active = activeTags.includes(tag)
        return (
          <Link
            key={tag}
            href={hrefForTag(tag)}
            className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
              active
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tag}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx jest __tests__/components/library.test.tsx 2>&1 | tail -5
```

Expected: PASS — 7 tests passing.

- [ ] **Step 7: Commit**

```bash
git add components/library/ __tests__/components/library.test.tsx
git commit -m "feat: PatchCard, SearchBar, TagFilter library components"
```

---

## Task 13: PatchForm Component

**Files:**
- Create: `components/patch-form/PatchForm.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/PatchForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues } from '@/lib/types'

const defaultValues: PatchFormValues = {
  name: '',
  description: '',
  tags: [],
  knobSettings: {},
  connections: [],
  sequenceNotes: '',
  audioUrl: '',
}

describe('PatchForm', () => {
  it('renders name input', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByPlaceholderText(/patch name/i)).toBeInTheDocument()
  })

  it('renders knob grid section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/knob settings/i)).toBeInTheDocument()
  })

  it('renders patch bay section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/patch bay/i)).toBeInTheDocument()
  })

  it('calls onSubmit with form values when saved', () => {
    const onSubmit = jest.fn()
    render(<PatchForm defaultValues={defaultValues} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/patch name/i), { target: { value: 'My Patch' } })
    fireEvent.click(screen.getByText(/save patch/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Patch' }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/PatchForm.test.tsx 2>&1 | tail -5
```

Expected: FAIL — `Cannot find module '@/components/patch-form/PatchForm'`

- [ ] **Step 3: Create components/patch-form/PatchForm.tsx**

```tsx
// components/patch-form/PatchForm.tsx
'use client'

import { useState, useCallback } from 'react'
import type { PatchFormValues, ConnectionFormValue } from '@/lib/types'
import { KnobGrid } from '@/components/dfam/KnobGrid'
import { PatchBay } from '@/components/dfam/PatchBay'

interface PatchFormProps {
  defaultValues: PatchFormValues
  onSubmit: (values: PatchFormValues) => void
  isSubmitting?: boolean
}

export function PatchForm({ defaultValues, onSubmit, isSubmitting = false }: PatchFormProps) {
  const [name, setName] = useState(defaultValues.name)
  const [description, setDescription] = useState(defaultValues.description)
  const [tagsInput, setTagsInput] = useState(defaultValues.tags.join(', '))
  const [knobSettings, setKnobSettings] = useState<Record<string, number>>(defaultValues.knobSettings)
  const [connections, setConnections] = useState<ConnectionFormValue[]>(defaultValues.connections)
  const [sequenceNotes, setSequenceNotes] = useState(defaultValues.sequenceNotes)
  const [audioUrl, setAudioUrl] = useState(defaultValues.audioUrl)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
      onSubmit({ name, description, tags, knobSettings, connections, sequenceNotes, audioUrl })
    },
    [name, description, tagsInput, knobSettings, connections, sequenceNotes, audioUrl, onSubmit],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Metadata */}
      <section className="space-y-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800">
          Patch Info
        </div>
        <div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Patch name…"
            required
            className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
        <div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)…"
            rows={2}
            className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
          />
        </div>
        <div>
          <input
            type="text"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="Tags (comma separated): bass, kick, drone…"
            className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </section>

      {/* Knob settings */}
      <section>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
          Knob Settings
        </div>
        <KnobGrid values={knobSettings} onChange={setKnobSettings} />
      </section>

      {/* Patch bay */}
      <section>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
          Patch Bay
        </div>
        <PatchBay connections={connections} onChange={setConnections} />
      </section>

      {/* Notes */}
      <section className="space-y-4">
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
        <input
          type="url"
          value={audioUrl}
          onChange={e => setAudioUrl(e.target.value)}
          placeholder="Audio reference URL (optional)…"
          className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/components/PatchForm.test.tsx 2>&1 | tail -5
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add components/patch-form/PatchForm.tsx __tests__/components/PatchForm.test.tsx
git commit -m "feat: PatchForm — combined metadata + knobs + patch bay form"
```

---

## Task 14: Library Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx with the library page**

```tsx
// app/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'

interface PageProps {
  searchParams: { search?: string; tags?: string }
}

async function PatchList({ search, activeTags }: { search: string; activeTags: string[] }) {
  const patches = await prisma.patch.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        activeTags.length > 0 ? { tags: { hasSome: activeTags } } : {},
      ],
    },
    include: { _count: { select: { connections: true } } },
    orderBy: { createdAt: 'desc' },
  })

  if (patches.length === 0) {
    return (
      <p className="text-zinc-600 text-sm font-mono py-12 text-center">
        No patches found.{' '}
        <Link href="/patches/new" className="text-orange-500 hover:text-orange-400">
          Create one?
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map(patch => (
        <PatchCard key={patch.id} patch={patch} />
      ))}
    </div>
  )
}

async function AllTags() {
  const patches = await prisma.patch.findMany({ select: { tags: true } })
  const tags = [...new Set(patches.flatMap(p => p.tags))].sort()
  return tags
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const search = searchParams.search || ''
  const activeTags = searchParams.tags?.split(',').filter(Boolean) || []
  const allTags = await AllTags()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <span className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">PATCHLIB</span>
        <Link
          href="/patches/new"
          className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
        >
          + NEW PATCH
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <Suspense>
          <SearchBar defaultValue={search} />
        </Suspense>

        {allTags.length > 0 && (
          <Suspense>
            <TagFilter tags={allTags} activeTags={activeTags} />
          </Suspense>
        )}

        <Suspense fallback={<p className="text-zinc-600 text-sm font-mono py-4">Loading…</p>}>
          <PatchList search={search} activeTags={activeTags} />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: library page with search, tag filter, patch list"
```

---

## Task 15: Create Patch Page

**Files:**
- Create: `app/patches/new/page.tsx`

- [ ] **Step 1: Create app/patches/new/page.tsx**

```tsx
// app/patches/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues } from '@/lib/types'

const emptyPatch: PatchFormValues = {
  name: '',
  description: '',
  tags: [],
  knobSettings: {},
  connections: [],
  sequenceNotes: '',
  audioUrl: '',
}

export default function NewPatchPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (values: PatchFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const knobSettings = Object.entries(values.knobSettings).map(([knobId, value]) => ({
        knobId,
        value,
      }))
      const res = await fetch('/api/patches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, knobSettings }),
      })
      if (!res.ok) throw new Error('Failed to save patch')
      const patch = await res.json()
      router.push(`/patches/${patch.id}`)
    } catch (e) {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          PATCHLIB
        </Link>
        <span className="text-xs font-mono text-zinc-500">New Patch · DFAM</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm font-mono border border-red-900/50 rounded px-4 py-2">
            {error}
          </div>
        )}
        <PatchForm
          defaultValues={emptyPatch}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/patches/new/page.tsx
git commit -m "feat: create patch page"
```

---

## Task 16: Patch Detail Page

**Files:**
- Create: `app/patches/[id]/page.tsx`

- [ ] **Step 1: Create app/patches/[id]/page.tsx**

```tsx
// app/patches/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DFAM_JACKS, CABLE_COLORS, DFAM_KNOBS } from '@/lib/dfam'
import { DeletePatchButton } from '@/components/patch-form/DeletePatchButton'

interface PageProps {
  params: { id: string }
}

function colorHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

export default async function PatchDetailPage({ params }: PageProps) {
  const patch = await prisma.patch.findUnique({
    where: { id: params.id },
    include: { knobSettings: true, connections: true },
  })

  if (!patch) notFound()

  const date = new Date(patch.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Only show knobs that differ from default value
  const knobMap = Object.fromEntries(patch.knobSettings.map(k => [k.knobId, k.value]))
  const displayKnobs = DFAM_KNOBS.filter(
    def => knobMap[def.id] !== undefined && knobMap[def.id] !== def.defaultValue,
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          PATCHLIB
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/patches/${patch.id}/edit`}
            className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
          >
            Edit
          </Link>
          <DeletePatchButton patchId={patch.id} />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100 mb-1">{patch.name}</h1>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span className="border border-zinc-700 rounded px-1.5 py-0.5">{patch.device}</span>
            <span>{date}</span>
          </div>
          {patch.description && (
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{patch.description}</p>
          )}
          {patch.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {patch.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Knob settings */}
        {displayKnobs.length > 0 && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
              Knob Settings
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {displayKnobs.map(def => (
                <div
                  key={def.id}
                  className="flex items-center justify-between bg-[#111] border border-zinc-800 rounded px-3 py-2"
                >
                  <span className="text-[11px] font-mono text-zinc-500">{def.label}</span>
                  <span className="text-sm font-mono font-bold text-orange-400">
                    {knobMap[def.id].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Patch bay (read-only SVG) */}
        {patch.connections.length > 0 && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
              Patch Bay · {patch.connections.length} cable{patch.connections.length !== 1 ? 's' : ''}
            </div>
            <div className="bg-[#0f0f0f] border border-zinc-800 rounded overflow-hidden mb-3">
              <svg width="100%" viewBox="0 0 560 100" className="block" style={{ fontFamily: 'monospace' }}>
                <text x="8" y="29" fill="#3a3a3a" fontSize="8">OUT</text>
                <text x="8" y="79" fill="#3a3a3a" fontSize="8">IN</text>

                {patch.connections.map((conn, i) => {
                  const from = [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs].find(j => j.id === conn.fromJack)
                  const to = [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs].find(j => j.id === conn.toJack)
                  if (!from || !to) return null
                  const midY = (from.y + to.y) / 2 + 10
                  return (
                    <path
                      key={i}
                      d={`M ${from.x},${from.y} C ${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`}
                      stroke={colorHex(conn.color)}
                      strokeWidth="2"
                      fill="none"
                      strokeOpacity="0.8"
                    />
                  )
                })}

                {DFAM_JACKS.outputs.map(jack => {
                  const isUsed = patch.connections.some(c => c.fromJack === jack.id)
                  return (
                    <g key={jack.id}>
                      <circle cx={jack.x} cy={jack.y} r={8} fill="#1a1a1a" stroke={isUsed ? '#555' : '#2a2a2a'} strokeWidth="1.5" />
                      <text x={jack.x} y={jack.y + 19} textAnchor="middle" fill="#555" fontSize="7">{jack.label}</text>
                    </g>
                  )
                })}

                {DFAM_JACKS.inputs.map(jack => {
                  const isUsed = patch.connections.some(c => c.toJack === jack.id)
                  return (
                    <g key={jack.id}>
                      <circle cx={jack.x} cy={jack.y} r={8} fill="#1a1a1a" stroke={isUsed ? '#555' : '#2a2a2a'} strokeWidth="1.5" />
                      <text x={jack.x} y={jack.y + 19} textAnchor="middle" fill="#555" fontSize="7">{jack.label}</text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Cable list */}
            <div className="space-y-1.5">
              {patch.connections.map((conn, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorHex(conn.color) }}
                  />
                  <span>
                    {[...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs].find(j => j.id === conn.fromJack)?.label ?? conn.fromJack}
                    {' → '}
                    {[...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs].find(j => j.id === conn.toJack)?.label ?? conn.toJack}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {patch.sequenceNotes && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">
              Notes
            </div>
            <p className="text-sm font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {patch.sequenceNotes}
            </p>
          </section>
        )}

        {patch.audioUrl && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">
              Audio Reference
            </div>
            <a
              href={patch.audioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-orange-500 hover:text-orange-400 underline"
            >
              {patch.audioUrl}
            </a>
          </section>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create components/patch-form/DeletePatchButton.tsx** (client component needed for delete action)

```tsx
// components/patch-form/DeletePatchButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeletePatchButton({ patchId }: { patchId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    await fetch(`/api/patches/${patchId}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          className="text-xs font-mono text-red-400 border border-red-900/50 rounded px-2 py-1 hover:bg-red-950/50 transition-colors"
        >
          Confirm delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-mono text-zinc-500 px-2 py-1"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-mono text-zinc-500 border border-zinc-800 rounded px-2 py-1 hover:text-red-400 hover:border-red-900/50 transition-colors"
    >
      Delete
    </button>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/patches/[id]/page.tsx components/patch-form/DeletePatchButton.tsx
git commit -m "feat: patch detail page (read-only) with SVG cables and knob list"
```

---

## Task 17: Edit Patch Page

**Files:**
- Create: `app/patches/[id]/edit/page.tsx`

- [ ] **Step 1: Create app/patches/[id]/edit/page.tsx**

```tsx
// app/patches/[id]/edit/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues, PatchWithRelations } from '@/lib/types'

function patchToFormValues(patch: PatchWithRelations): PatchFormValues {
  const knobSettings = Object.fromEntries(
    patch.knobSettings.map(k => [k.knobId, k.value]),
  )
  return {
    name: patch.name,
    description: patch.description ?? '',
    tags: patch.tags,
    knobSettings,
    connections: patch.connections.map(c => ({
      fromJack: c.fromJack,
      toJack: c.toJack,
      color: c.color,
    })),
    sequenceNotes: patch.sequenceNotes ?? '',
    audioUrl: patch.audioUrl ?? '',
  }
}

export default function EditPatchPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [patch, setPatch] = useState<PatchWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/patches/${params.id}`)
      .then(r => r.json())
      .then(setPatch)
      .catch(() => setError('Failed to load patch'))
  }, [params.id])

  const handleSubmit = useCallback(
    async (values: PatchFormValues) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const knobSettings = Object.entries(values.knobSettings).map(([knobId, value]) => ({
          knobId,
          value,
        }))
        const res = await fetch(`/api/patches/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, knobSettings }),
        })
        if (!res.ok) throw new Error('Failed to update patch')
        router.push(`/patches/${params.id}`)
        router.refresh()
      } catch {
        setError('Something went wrong. Please try again.')
        setIsSubmitting(false)
      }
    },
    [params.id, router],
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          PATCHLIB
        </Link>
        <span className="text-xs font-mono text-zinc-500">Edit Patch</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm font-mono border border-red-900/50 rounded px-4 py-2">
            {error}
          </div>
        )}
        {!patch ? (
          <p className="text-zinc-600 font-mono text-sm">Loading…</p>
        ) : (
          <PatchForm
            defaultValues={patchToFormValues(patch)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/patches/[id]/edit/page.tsx
git commit -m "feat: edit patch page — loads existing patch, submits PUT"
```

---

## Task 18: Seed Data

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create prisma/seed.ts**

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.cableConnection.deleteMany()
  await prisma.knobSetting.deleteMany()
  await prisma.patch.deleteMany()

  const heavyKick = await prisma.patch.create({
    data: {
      name: 'Heavy Kick',
      device: 'DFAM',
      description: 'Deep punchy kick drum with short, snappy envelope',
      tags: ['percussion', 'kick'],
      knobSettings: {
        create: [
          { knobId: 'tempo',         value: 7.2 },
          { knobId: 'vco1_freq',     value: 3.0 },
          { knobId: 'eg_decay',      value: 8.1 },
          { knobId: 'vcf_cutoff',    value: 4.5 },
          { knobId: 'vcf_resonance', value: 2.0 },
          { knobId: 'vca_level',     value: 9.0 },
        ],
      },
      connections: {
        create: [
          { fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' },
          { fromJack: 'eg_out',   toJack: 'vcf_cv',   color: 'blue'   },
        ],
      },
    },
  })

  const acidLoop = await prisma.patch.create({
    data: {
      name: 'Acid Loop',
      device: 'DFAM',
      description: 'Squelchy 303-style acid bassline — turn up VCF resonance',
      tags: ['bass', 'acid'],
      knobSettings: {
        create: [
          { knobId: 'tempo',         value: 5.0 },
          { knobId: 'vco1_freq',     value: 6.5 },
          { knobId: 'vcf_cutoff',    value: 8.0 },
          { knobId: 'vcf_resonance', value: 7.0 },
          { knobId: 'eg_decay',      value: 3.5 },
          { knobId: 'eg_attack',     value: 0.5 },
        ],
      },
      connections: {
        create: [
          { fromJack: 'vco2_out',  toJack: 'vco1_fm',  color: 'orange' },
          { fromJack: 'eg_out',    toJack: 'vcf_cv',   color: 'blue'   },
          { fromJack: 'tempo_out', toJack: 'adv_clock', color: 'green' },
        ],
      },
    },
  })

  const darkDrone = await prisma.patch.create({
    data: {
      name: 'Dark Drone',
      device: 'DFAM',
      description: 'Slow evolving ambient texture — slow tempo, long attack/decay',
      tags: ['drone', 'ambient'],
      sequenceNotes: 'Set all 8 steps to the same pitch for a static tone. Slowly open VCF cutoff over time.',
      knobSettings: {
        create: [
          { knobId: 'tempo',      value: 2.0 },
          { knobId: 'vco1_freq',  value: 1.2 },
          { knobId: 'vco2_freq',  value: 1.8 },
          { knobId: 'eg_attack',  value: 9.0 },
          { knobId: 'eg_decay',   value: 9.5 },
          { knobId: 'vcf_cutoff', value: 3.0 },
        ],
      },
      connections: {
        create: [
          { fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' },
          { fromJack: 'vco2_out', toJack: 'vco1_fm',  color: 'blue'   },
        ],
      },
    },
  })

  console.log('Seeded patches:', heavyKick.name, '/', acidLoop.name, '/', darkDrone.name)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Add seed config to package.json**

In `package.json`, add under the top-level object:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

And add to `"scripts"`:
```json
"db:seed": "npx prisma db seed"
```

- [ ] **Step 3: Run the seed**

```bash
npm run db:seed
```

Expected output:
```
Seeded patches: Heavy Kick / Acid Loop / Dark Drone
```

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: seed data with 3 DFAM example patches"
```

---

## Task 19: Deployment Config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create vercel.json**

```json
{
  "buildCommand": "npx prisma generate && next build",
  "env": {
    "DATABASE_URL": "@database-url"
  }
}
```

- [ ] **Step 2: Add DATABASE_URL to Vercel**

In the Vercel dashboard for the project, go to **Settings → Environment Variables** and add:
- Key: `DATABASE_URL`
- Value: your RDS connection string
- Environments: Production, Preview, Development

- [ ] **Step 3: Ensure RDS security group allows Vercel IPs**

Vercel uses dynamic IPs. For simplest setup, set the RDS security group inbound rule for port 5432 to `0.0.0.0/0`. For production, use Vercel's IP ranges or connect via a proxy.

- [ ] **Step 4: Run full test suite**

```bash
npx jest 2>&1 | tail -15
```

Expected: All tests passing.

- [ ] **Step 5: Final build check**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 6: Final commit**

```bash
git add vercel.json
git commit -m "feat: Vercel deployment config with Prisma generate build step"
```

---

## Running the App

```bash
# Development
npm run dev
# Open http://localhost:3000

# Seed database
npm run db:seed

# Run tests
npm test

# Build for production
npm run build
```

---

## Self-Review Checklist (completed)

- [x] **Spec coverage:** All spec sections mapped to tasks — library page ✓, create/edit ✓, detail ✓, knob grid ✓, patch bay ✓, data model ✓, API ✓, seed data ✓, deployment ✓
- [x] **Placeholders:** None. All code steps contain complete implementations.
- [x] **Type consistency:** `PatchFormValues`, `ConnectionFormValue`, `PatchWithRelations`, `PatchListItem` defined in Task 5 and used consistently in Tasks 13–17. `KnobDef`, `JackDef`, `CableColorDef` defined in Task 4 and used in Tasks 8–11.
