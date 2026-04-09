# PatchLib — MVP Design Spec
Date: 2026-04-09

## Product Summary

PatchLib is a lightweight external memory for analog semi-modular synthesizer patches. It solves the core problem that synths like the DFAM have no preset storage — every sound lives only in knob positions, sequence settings, and physical cable routing. PatchLib lets musicians capture, name, tag, search, and recall patches through a fast web UI, building a persistent personal sound library over time.

---

## MVP Scope

- DFAM only (one synth, one device type)
- One synth per patch entry
- Create, edit, delete patches
- Visual knob grid for knob capture
- Visual SVG patch bay for cable connections
- Library view with search and tag filtering
- Patch detail (read-only) view
- No user accounts, no real-time collaboration, no MIDI, no cloud sync beyond the database

---

## Architecture

**Frontend + API:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui  
**Database ORM:** Prisma  
**Database:** AWS RDS PostgreSQL  
**Deployment:** Vercel (app) + AWS RDS (data)

```
Vercel (Next.js App Router)
  ├── app/
  │   ├── page.tsx                  # Library — search, browse, filter
  │   ├── patches/new/page.tsx      # Create patch
  │   ├── patches/[id]/page.tsx     # Patch detail (read-only)
  │   ├── patches/[id]/edit/page.tsx # Edit patch
  │   └── api/patches/
  │       ├── route.ts              # GET (list), POST (create)
  │       └── [id]/route.ts         # GET, PUT, DELETE
  ├── components/
  │   ├── dfam/
  │   │   ├── KnobGrid.tsx          # Interactive knob panel
  │   │   └── PatchBay.tsx          # SVG cable routing
  │   ├── library/
  │   │   ├── PatchCard.tsx
  │   │   ├── SearchBar.tsx
  │   │   └── TagFilter.tsx
  │   └── ui/                       # shadcn base components
  └── lib/
      ├── prisma.ts                 # Prisma client singleton
      └── dfam.ts                   # DFAM jack/knob static definitions
```

Data flow: UI → Next.js API route → Prisma → RDS PostgreSQL. No caching, no message queue, no separate backend service.

---

## Data Model

```prisma
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
  knobId  String  // e.g. "tempo", "vco1_freq", "seq_1_pitch"
  value   Float   // 0.0–10.0
}

model CableConnection {
  id       String @id @default(cuid())
  patch    Patch  @relation(fields: [patchId], references: [id], onDelete: Cascade)
  patchId  String
  fromJack String  // e.g. "vco1_out"
  toJack   String  // e.g. "vcf_in"
  color    String  // named color: "orange", "blue", "green", "red", "white"
}
```

### DFAM Knob Definitions (static, in `lib/dfam.ts`)

**Main panel — rotary knobs (11):**
- `tempo`, `vco1_freq`, `vco2_freq`, `noise_level`
- `vco1_decay`, `vco2_decay`, `eg_attack`, `eg_decay`
- `vcf_cutoff`, `vcf_resonance`, `vca_level`

**Main panel — toggle switches (2, rendered as 2-position toggles, not dials):**
- `vco1_wave` (0=triangle, 1=sawtooth)
- `vco2_wave` (0=triangle, 1=sawtooth)

**Sequencer (16 knobs, 8 steps):**
- `seq_1_pitch` … `seq_8_pitch`
- `seq_1_vel` … `seq_8_vel`

### DFAM Patch Bay (static, in `lib/dfam.ts`)

**Outputs (7):** `vco1_out`, `vco2_out`, `noise_out`, `eg_out`, `tempo_out`, `midi_gate`, `midi_pitch`

**Inputs (7):** `vco1_fm`, `vco2_fm`, `vcf_cv`, `audio_in`, `adv_clock`, `run_stop`, `velocity_in`

Jack x/y positions are hardcoded in `lib/dfam.ts` to match the physical DFAM panel layout. The SVG patch bay renders cables as Bézier curves between jack positions.

---

## Screens & Key Components

### 1. Library (`/`)
- Top nav with PATCHLIB wordmark + "New Patch" button
- Search bar (filters by name, description, tags)
- Tag filter chips (click to toggle active filter)
- Patch list: card per patch showing name, device, cable count, tags, date
- Clicking a card navigates to detail view

### 2. Create / Edit (`/patches/new`, `/patches/[id]/edit`)
- Single scrollable page
- Section 1: Name (required), description (optional), tags (comma input)
- Section 2: Knob Grid — all DFAM knobs rendered as interactive draggable dials (SVG), value displayed below each dial, grouped by section (Main Panel / Sequencer)
- Section 3: Patch Bay — SVG canvas showing all outputs and inputs as circles. Click output jack → click input jack to draw a cable. Color picker per cable. Click existing cable to delete.
- Section 4: Notes — optional sequence notes textarea, optional audio URL field
- Save button (sticky footer)

### 3. Patch Detail (`/patches/[id]`)
- Read-only view of all patch data
- Header: name, device badge, date, Edit button, delete (⋯ menu)
- Tags
- Knob settings: compact grid showing knob name + value for all non-default knobs
- Patch bay: same SVG render as editor but non-interactive, cables drawn in their colors
- Notes section if present

---

## Key Technical Decisions

### Knob Grid (KnobGrid.tsx)
- SVG-based rotary dials for all 11 main rotary knobs + 16 sequencer knobs
- Each rotary knob: 270° sweep, drag to rotate (mouse/touch), value 0.0–10.0
- Toggle switches (`vco1_wave`, `vco2_wave`): rendered as a 2-position toggle button (TRI / SAW), not a dial
- Knobs grouped: Main Panel section + Sequencer section (collapsible)
- Value shown as number below dial, editable by clicking the number

### Patch Bay (PatchBay.tsx)
- SVG canvas, fixed aspect ratio matching DFAM panel proportions
- Outputs row (top) and inputs row (bottom)
- Each jack: filled circle, label below
- Active connection state: first click selects output (highlights it), second click on input completes the cable
- Cable: cubic Bézier curve between jack centers, colored by selected color
- Color picker: small palette of 5 cable colors shown during connection
- Clicking an existing cable selects it (highlights) and shows a delete button

### API
- `GET /api/patches` — list all, supports `?search=` and `?tags=` query params
- `POST /api/patches` — create with full knob + cable data
- `GET /api/patches/[id]` — single patch with relations
- `PUT /api/patches/[id]` — full replace
- `DELETE /api/patches/[id]` — cascade deletes settings and connections

---

## Visual Design Direction
- Dark background: `#0a0a0a`
- Surface: `#111111`, `#161616`
- Accent: `#e07b39` (Moog orange)
- Text: `#eeeeee` (primary), `#888888` (secondary), `#444444` (muted)
- Monospace font for knob values and jack labels
- No rounded corners > 6px — industrial feel
- Cable colors: orange `#e07b39`, blue `#5b9bd5`, green `#7ec87e`, red `#e05555`, white `#dddddd`

---

## Seed Data

Three example patches:
1. **Heavy Kick** — tags: percussion, kick — TEMPO 7.2, VCO1 FREQ 3.0, EG DECAY 8.1, VCF CUTOFF 4.5 — cables: VCO1 OUT→AUDIO IN (orange), EG OUT→VCF CV (blue)
2. **Acid Loop** — tags: bass, acid — TEMPO 5.0, VCO1 FREQ 6.5, VCF CUTOFF 8.0, VCF RES 7.0 — cables: VCO2 OUT→VCO1 FM (orange), EG OUT→VCF CV (blue), TEMPO OUT→ADV CLOCK (green)
3. **Dark Drone** — tags: drone, ambient — TEMPO 2.0, VCO1 FREQ 1.2, VCO2 FREQ 1.8, EG ATTACK 9.0, EG DECAY 9.5 — cables: VCO1 OUT→AUDIO IN (orange), VCO2 OUT→VCO1 FM (blue)

---

## Next Features After MVP
1. Mother 32 and Subharmonicon device support
2. Photo attachment (upload patch photo)
3. Audio URL preview (embed SoundCloud / direct URL)
4. Patch duplication
5. Export patch as PDF or image
6. Multi-device patches (cross-synth cable routing)
7. User accounts + private/public patches
