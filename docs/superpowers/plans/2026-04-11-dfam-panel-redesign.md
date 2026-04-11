# DFAM Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the KnobGrid block-layout with a hardware-faithful 1000×430px absolute-positioned DFAM panel that mirrors the physical instrument's layout.

**Architecture:** Create `DFAMPanel.tsx` with `position:relative` container and all controls placed via `position:absolute` at pixel-exact coordinates matching the DFAM hardware layout. `KnobGrid.tsx` is deleted. `PatchForm.tsx` is updated to use `DFAMPanel` and renders the interactive `PatchBay` below the panel. The panel's right strip shows a visual-only (non-interactive) jack display from the connections prop.

**Tech Stack:** React 19, TypeScript, Next.js App Router, Tailwind CSS (for PatchForm wrapper), inline styles (for panel absolute positioning), Jest + Testing Library.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `components/dfam/DFAMPanel.tsx` | 1000×430px absolute-positioned panel — all 7 clusters + visual patchbay strip |
| Modify | `components/dfam/WaveToggle.tsx` | Restyle from horizontal segmented buttons to vertical hardware lever |
| Modify | `components/dfam/Knob.tsx` | Minor disc color tweak (#1a1a1a→#141414, stroke #2a2a2a→#303030) |
| Modify | `components/patch-form/PatchForm.tsx` | Replace KnobGrid+separate-PatchBay with DFAMPanel+PatchBay-below |
| Create | `__tests__/components/DFAMPanel.test.tsx` | Tests for DFAMPanel (replaces KnobGrid tests) |
| Modify | `__tests__/components/PatchForm.test.tsx` | Update mock from KnobGrid to DFAMPanel |
| Delete | `components/dfam/KnobGrid.tsx` | Replaced by DFAMPanel |
| Delete | `__tests__/components/KnobGrid.test.tsx` | Replaced by DFAMPanel.test |

---

## Task 1: Restyle WaveToggle to vertical hardware lever

**Files:**
- Modify: `components/dfam/WaveToggle.tsx`
- Test: `__tests__/components/WaveToggle.test.tsx` (no changes required — all existing tests pass)

- [ ] **Step 1: Run existing WaveToggle tests to confirm baseline**

```bash
npx jest __tests__/components/WaveToggle.test.tsx --no-coverage
```
Expected: 5 tests pass.

- [ ] **Step 2: Replace WaveToggle implementation**

Replace the entire file `components/dfam/WaveToggle.tsx`:

```tsx
'use client'

interface WaveToggleProps {
  id: string
  label: string
  value: number   // index of selected option (0, 1, or 2)
  onChange: (id: string, value: number) => void
  options?: string[]
}

export function WaveToggle({ id, label, value, onChange, options = ['OFF', 'ON'] }: WaveToggleProps) {
  const isThree = options.length >= 3
  const bodyH = isThree ? 36 : 28

  // Lever top position in px within the switch body
  const leverTop =
    value === 0
      ? 2
      : isThree && value === 1
      ? Math.floor((bodyH - 9) / 2)
      : bodyH - 11

  return (
    <div className="flex flex-col items-center gap-1 select-none" data-testid={`toggle-${id}`}>
      <div className="flex items-center gap-1.5">
        {/* Switch body — visual lever */}
        <div
          className="relative bg-[#141414] border border-zinc-600 rounded flex-shrink-0"
          style={{ width: 13, height: bodyH }}
        >
          <div
            className="absolute bg-zinc-300 rounded-sm transition-[top] duration-100 ease-in-out"
            style={{
              width: 8,
              height: 9,
              left: '50%',
              transform: 'translateX(-50%)',
              top: leverTop,
            }}
          />
        </div>

        {/* Option labels — each a clickable button */}
        <div className="flex flex-col" style={{ gap: isThree ? 3 : 5 }}>
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(id, i)}
              className={`text-[8px] font-mono leading-none transition-colors ${
                value === i ? 'text-orange-400 font-bold' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Control label */}
      <span
        className="text-zinc-500 uppercase tracking-wide text-center leading-tight"
        style={{ fontSize: 9, maxWidth: 52 }}
      >
        {label}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Run WaveToggle tests**

```bash
npx jest __tests__/components/WaveToggle.test.tsx --no-coverage
```
Expected: 5 tests pass. The option labels are still rendered as clickable buttons so `getByText('VCO2')` finds them.

- [ ] **Step 4: Commit**

```bash
git add components/dfam/WaveToggle.tsx
git commit -m "feat: restyle WaveToggle to vertical hardware lever"
```

---

## Task 2: Tweak Knob disc colors

**Files:**
- Modify: `components/dfam/Knob.tsx:81`

- [ ] **Step 1: Run existing Knob tests to confirm baseline**

```bash
npx jest __tests__/components/Knob.test.tsx --no-coverage
```
Expected: all pass.

- [ ] **Step 2: Update disc fill and stroke colors**

In `components/dfam/Knob.tsx`, find line 81:
```tsx
        <circle cx={r} cy={r} r={r - 3} fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5" />
```

Replace with:
```tsx
        <circle cx={r} cy={r} r={r - 3} fill="#141414" stroke="#303030" strokeWidth="1.5" />
```

- [ ] **Step 3: Run Knob tests**

```bash
npx jest __tests__/components/Knob.test.tsx --no-coverage
```
Expected: all pass (no snapshot tests, color changes don't affect behavior).

- [ ] **Step 4: Commit**

```bash
git add components/dfam/Knob.tsx
git commit -m "feat: darken knob disc to match panel aesthetic"
```

---

## Task 3: Create DFAMPanel.tsx

**Files:**
- Create: `components/dfam/DFAMPanel.tsx`

Context: The panel is 1000×430px with `position:relative`. All controls use `position:absolute` with `left` set to the horizontal center of the disc and `transform:translateX(-50%)` for centering. The right 16% (left:840px) is a visual-only patchbay strip showing connection state as colored dots in jacks.

Cluster pixel coordinates (all `left` values are disc centers):

**Cluster A — VCO/Pitch/FM:**
- Row 1 top:77px — VCO DECAY(55), SEQ PITCH MOD(107), VCO1 EG AMT(152), VCO1 FREQ(218)
- Row 2 top:172px — 1-2 FM AMT(55), HARD SYNC(107), VCO2 EG AMT(152), VCO2 FREQ(218)
- Switches at top:82 / top:181

**Cluster B — Wave/Mixer:**
- VCO1 WAVE switch left:305 top:77 | VCO1 LEVEL knob(26px) left:348 top:77
- NOISE/EXT LVL knob(26px) left:327 top:127
- VCO2 WAVE switch left:305 top:172 | VCO2 LEVEL knob(26px) left:348 top:172

**Cluster C — Filter:**
- VCF MODE switch left:415 top:82 | CUTOFF left:460 top:77 | RESONANCE left:527 top:77
- VCF DECAY left:460 top:172 | VCF EG AMT left:527 top:172

**Cluster D — VCA/Output:**
- VCA EG switch left:615 top:82 | VOLUME left:660 top:77
- NOISE/VCF MOD left:615 top:172 | VCA DECAY left:660 top:172

**Cluster E — Transport:**
- TRIGGER button(26px circle) left:50 top:255
- TEMPO knob left:145 top:285
- RUN/STOP button left:80 top:352
- ADVANCE button left:175 top:352

**Cluster F — Sequencer (8 steps):**
- Column x values: [265, 340, 415, 491, 566, 641, 716, 792]
- Step number: top:230 | Pitch knob(26px): top:262 | LED dot: top:298 | Velocity knob(26px): top:330

**Cluster G — Visual patchbay strip (left:840, width:160):**
- Jack columns within strip at x: 22, 66, 110 (relative to strip left edge)
- Row tops: [57, 104, 151, 198, 245, 292, 339, 386]

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/DFAMPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { DFAMPanel } from '@/components/dfam/DFAMPanel'

const noop = () => {}

describe('DFAMPanel', () => {
  it('renders the DFAM panel title', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('renders VCO DECAY knob label', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('VCO DECAY')).toBeInTheDocument()
  })

  it('renders TEMPO knob label', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders RUN transport button', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('RUN')).toBeInTheDocument()
  })

  it('renders TRIGGER button', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('TRIGGER')).toBeInTheDocument()
  })

  it('renders ADVANCE button', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('ADVANCE')).toBeInTheDocument()
  })

  it('renders 8 sequencer step numbers', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('renders SEQ PITCH MOD options OFF, VCO1, VCO2', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getAllByText('OFF').length).toBeGreaterThan(0)
    expect(screen.getByText('VCO1')).toBeInTheDocument()
    expect(screen.getByText('VCO2')).toBeInTheDocument()
  })

  it('renders HARD SYNC ON option', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getAllByText('ON').length).toBeGreaterThan(0)
  })

  it('renders VCF MODE switch (HP / LP)', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('HP')).toBeInTheDocument()
    expect(screen.getByText('LP')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx jest __tests__/components/DFAMPanel.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '@/components/dfam/DFAMPanel'`.

- [ ] **Step 3: Create DFAMPanel.tsx**

Create `components/dfam/DFAMPanel.tsx`:

```tsx
'use client'

import { useState, useCallback } from 'react'
import { DFAM_KNOBS, DFAM_PATCH_POINTS, CABLE_COLORS, SEQUENCER_STEPS } from '@/lib/dfam'
import { Knob } from './Knob'
import { WaveToggle } from './WaveToggle'

type KnobValues = Record<string, number>
interface Connection { fromJack: string; toJack: string; color: string }

interface DFAMPanelProps {
  values: KnobValues
  onChange: (values: KnobValues) => void
  connections: Connection[]
  onConnectionsChange: (connections: Connection[]) => void
}

// Patchbay row tops (px) — 8 rows
const JACK_ROWS = [57, 104, 151, 198, 245, 292, 339, 386]
// Jack column x positions within the 160px patchbay strip
const JACK_COLS = [22, 66, 110]
// Sorted patch points: row asc, col asc
const SORTED_POINTS = [...DFAM_PATCH_POINTS].sort(
  (a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col,
)

export function DFAMPanel({ values, onChange, connections, onConnectionsChange }: DFAMPanelProps) {
  const [triggerActive, setTriggerActive] = useState(false)
  const [runStop, setRunStop] = useState(false)
  const [advanceActive, setAdvanceActive] = useState(false)

  const handleChange = useCallback(
    (id: string, value: number) => onChange({ ...values, [id]: value }),
    [values, onChange],
  )

  const knobById = Object.fromEntries(DFAM_KNOBS.map(k => [k.id, k]))

  function kn(id: string, size = 48) {
    const k = knobById[id]
    return (
      <Knob
        id={k.id}
        label={k.label}
        value={values[k.id] ?? k.defaultValue}
        onChange={handleChange}
        min={k.min}
        max={k.max}
        size={size}
      />
    )
  }

  function sw(id: string) {
    const k = knobById[id]
    return (
      <WaveToggle
        id={k.id}
        label={k.label}
        value={values[k.id] ?? k.defaultValue}
        onChange={handleChange}
        options={k.options ?? ['OFF', 'ON']}
      />
    )
  }

  // Absolutely positioned control wrapper — left is horizontal center of the disc
  function C({
    left,
    top,
    children,
  }: {
    left: number
    top: number
    children: React.ReactNode
  }) {
    return (
      <div
        style={{
          position: 'absolute',
          left,
          top,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          fontFamily: "'Courier New', monospace",
        }}
      >
        {children}
      </div>
    )
  }

  const panelFont = "'Courier New', monospace"

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          position: 'relative',
          width: 1000,
          height: 430,
          background: '#1d1d1d',
          border: '2px solid #3a3a3a',
          borderRadius: 5,
          boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
          fontFamily: panelFont,
        }}
      >

        {/* ── PANEL HEADER ─────────────────────────────────────────── */}
        <div style={{ position: 'absolute', left: 16, top: 8, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 6, color: '#e8e0cc', fontFamily: panelFont }}>
            DFAM
          </span>
          <span style={{ fontSize: 7, letterSpacing: 2, color: '#3a3028', fontFamily: panelFont }}>
            DRUMMER FROM ANOTHER MOTHER
          </span>
        </div>

        {/* ── PATCHBAY BACKGROUND STRIP ────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: 840,
            top: 0,
            width: 160,
            height: 430,
            background: '#181818',
            borderLeft: '1px solid #2e2e2e',
          }}
        />

        {/* ── CLUSTER A: VCO / PITCH / FM ──────────────────────────── */}
        {/* Row 1 */}
        <C left={55}  top={77}>{kn('vco_decay')}</C>
        <C left={107} top={82}>{sw('seq_pitch_mod')}</C>
        <C left={152} top={77}>{kn('vco1_eg_amount')}</C>
        <C left={218} top={77}>{kn('vco1_freq')}</C>
        {/* Row 2 */}
        <C left={55}  top={172}>{kn('fm_1_2_amount')}</C>
        <C left={107} top={181}>{sw('hard_sync')}</C>
        <C left={152} top={172}>{kn('vco2_eg_amount')}</C>
        <C left={218} top={172}>{kn('vco2_freq')}</C>

        {/* ── CLUSTER B: WAVE / MIXER ──────────────────────────────── */}
        <C left={305} top={77}> {sw('vco1_wave')}</C>
        <C left={348} top={77}> {kn('vco1_level', 26)}</C>
        <C left={327} top={127}>{kn('noise_ext_level', 26)}</C>
        <C left={305} top={172}>{sw('vco2_wave')}</C>
        <C left={348} top={172}>{kn('vco2_level', 26)}</C>

        {/* ── CLUSTER C: FILTER ────────────────────────────────────── */}
        <C left={415} top={82}>{sw('vcf_mode')}</C>
        <C left={460} top={77}>{kn('vcf_cutoff')}</C>
        <C left={527} top={77}>{kn('vcf_resonance')}</C>
        <C left={460} top={172}>{kn('vcf_decay')}</C>
        <C left={527} top={172}>{kn('vcf_eg_amount')}</C>

        {/* ── CLUSTER D: VCA / OUTPUT ──────────────────────────────── */}
        <C left={615} top={82}>{sw('vca_eg')}</C>
        <C left={660} top={77}>{kn('volume')}</C>
        <C left={615} top={172}>{kn('noise_vcf_mod')}</C>
        <C left={660} top={172}>{kn('vca_decay')}</C>

        {/* ── CLUSTER E: TRANSPORT ─────────────────────────────────── */}
        {/* TRIGGER */}
        <div
          style={{
            position: 'absolute',
            left: 50,
            top: 255,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <button
            type="button"
            aria-label="Trigger"
            onPointerDown={() => setTriggerActive(true)}
            onPointerUp={() => setTriggerActive(false)}
            onPointerLeave={() => setTriggerActive(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: triggerActive ? '#e07b39' : '#252525',
              border: `1.5px solid ${triggerActive ? '#e07b39' : '#555'}`,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
            }}
          />
          <span style={{ fontSize: 9, color: '#c0b898', letterSpacing: 0.3 }}>TRIGGER</span>
        </div>

        {/* TEMPO */}
        <C left={145} top={285}>{kn('tempo')}</C>

        {/* RUN / STOP */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 352,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            type="button"
            onClick={() => setRunStop(r => !r)}
            style={{
              background: runStop ? '#e07b39' : '#181818',
              border: `1.5px solid ${runStop ? '#e07b39' : '#484848'}`,
              borderRadius: 7,
              padding: '3px 7px',
              fontSize: 9,
              color: runStop ? '#000' : '#7a7060',
              cursor: 'pointer',
              letterSpacing: 0.5,
              fontFamily: panelFont,
            }}
          >
            {runStop ? 'STOP' : 'RUN'}
          </button>
        </div>

        {/* ADVANCE */}
        <div
          style={{
            position: 'absolute',
            left: 175,
            top: 352,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            type="button"
            onPointerDown={() => setAdvanceActive(true)}
            onPointerUp={() => setAdvanceActive(false)}
            onPointerLeave={() => setAdvanceActive(false)}
            style={{
              background: advanceActive ? '#e07b39' : '#181818',
              border: `1.5px solid ${advanceActive ? '#e07b39' : '#484848'}`,
              borderRadius: 7,
              padding: '3px 7px',
              fontSize: 9,
              color: advanceActive ? '#000' : '#7a7060',
              cursor: 'pointer',
              letterSpacing: 0.5,
              fontFamily: panelFont,
            }}
          >
            ADVANCE
          </button>
        </div>

        {/* ── CLUSTER F: SEQUENCER ─────────────────────────────────── */}
        {[265, 340, 415, 491, 566, 641, 716, 792].map((x, i) => (
          <div key={i}>
            {/* Step number */}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 230,
                transform: 'translateX(-50%)',
                fontSize: 9,
                color: '#7a7060',
                fontFamily: panelFont,
              }}
            >
              {i + 1}
            </div>
            {/* Pitch knob */}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 262,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Knob
                id={`seq_${i + 1}_pitch`}
                label="PCH"
                value={values[`seq_${i + 1}_pitch`] ?? 5}
                onChange={handleChange}
                size={26}
              />
            </div>
            {/* LED */}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 298,
                transform: 'translate(-50%, -50%)',
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
              }}
            />
            {/* Velocity knob */}
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 330,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Knob
                id={`seq_${i + 1}_vel`}
                label="VEL"
                value={values[`seq_${i + 1}_vel`] ?? 5}
                onChange={handleChange}
                size={26}
              />
            </div>
          </div>
        ))}

        {/* ── CLUSTER G: PATCHBAY VISUAL STRIP ─────────────────────── */}
        {/* Column header */}
        <div
          style={{
            position: 'absolute',
            left: 906,
            top: 26,
            transform: 'translateX(-50%)',
            fontSize: 8,
            color: '#6a6050',
            letterSpacing: 1,
            fontFamily: panelFont,
          }}
        >
          IN / +
        </div>

        {/* Jack grid — visual only, shows connection state */}
        {SORTED_POINTS.map(point => {
          const connected = connections.find(
            c => c.fromJack === point.id || c.toJack === point.id,
          )
          const cableColor = connected
            ? (CABLE_COLORS.find(c => c.id === connected.color)?.hex ?? '#e07b39')
            : null
          const stripLeft = 840 + JACK_COLS[point.col - 1]
          const top = JACK_ROWS[point.row - 1]

          return (
            <div
              key={point.id}
              style={{
                position: 'absolute',
                left: stripLeft,
                top,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {/* Jack hole */}
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#0b0b0b',
                  border: `2px solid ${point.direction === 'out' ? '#b09048' : '#484848'}`,
                  position: 'relative',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95)',
                  flexShrink: 0,
                }}
              >
                {/* Connection dot */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: cableColor ?? '#070707',
                  }}
                />
              </div>
              {/* Jack label */}
              <div
                style={{
                  fontSize: 7,
                  color: '#6a6050',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  fontFamily: panelFont,
                  maxWidth: 40,
                }}
              >
                {point.label}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx jest __tests__/components/DFAMPanel.test.tsx --no-coverage
```
Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/dfam/DFAMPanel.tsx __tests__/components/DFAMPanel.test.tsx
git commit -m "feat: create DFAMPanel absolute-positioned hardware-faithful panel"
```

---

## Task 4: Wire DFAMPanel into PatchForm

**Files:**
- Modify: `components/patch-form/PatchForm.tsx`
- Modify: `__tests__/components/PatchForm.test.tsx`

Context: `PatchForm.tsx` currently renders `<KnobGrid>` (left column) and `<PatchBay>` (right column) side by side. The new layout: `<DFAMPanel>` full width (scrollable), then `<PatchBay>` below it for cable management. `DFAMPanel` receives `connections` and `onConnectionsChange` to show the visual patchbay strip. `PatchBay` below handles the interactive cable management.

- [ ] **Step 1: Run PatchForm tests to confirm baseline**

```bash
npx jest __tests__/components/PatchForm.test.tsx --no-coverage
```
Expected: 7 tests pass.

- [ ] **Step 2: Update PatchForm.test.tsx mock**

In `__tests__/components/PatchForm.test.tsx`, replace the KnobGrid mock with DFAMPanel:

```tsx
// Replace this block:
jest.mock('@/components/dfam/KnobGrid', () => ({
  KnobGrid: ({ onChange }: { onChange: (v: Record<string, number>) => void }) => (
    <div data-testid="knob-grid" onClick={() => onChange({ tempo: 7 })} />
  ),
}))

// With:
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
```

Also update the test `'renders sound engine section'` — the section heading text changes from "Sound Engine" to "DFAM Panel":

```tsx
  it('renders dfam panel', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByTestId('dfam-panel')).toBeInTheDocument()
  })
```

Remove the old test:
```tsx
  it('renders sound engine section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/sound engine/i)).toBeInTheDocument()
  })
```

- [ ] **Step 3: Run updated PatchForm tests to confirm they fail correctly**

```bash
npx jest __tests__/components/PatchForm.test.tsx --no-coverage
```
Expected: FAIL — `Cannot find module '@/components/dfam/DFAMPanel'` (not yet imported in PatchForm.tsx).

- [ ] **Step 4: Update PatchForm.tsx**

Replace the entire `components/patch-form/PatchForm.tsx`:

```tsx
'use client'

import { useState, useCallback } from 'react'
import type { PatchFormValues, ConnectionFormValue } from '@/lib/types'
import { DFAMPanel } from '@/components/dfam/DFAMPanel'
import { PatchBay } from '@/components/dfam/PatchBay'
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
  const [knobSettings, setKnobSettings] = useState<Record<string, number>>(defaultValues.knobSettings)
  const [connections, setConnections] = useState<ConnectionFormValue[]>(defaultValues.connections)
  const [sequenceNotes, setSequenceNotes] = useState(defaultValues.sequenceNotes)
  const [audioUrl, setAudioUrl] = useState(defaultValues.audioUrl)
  const [isPublic, setIsPublic] = useState(defaultValues.isPublic ?? false)

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
      onSubmit({ name, description, tags, knobSettings, connections, sequenceNotes, audioUrl, isPublic })
    },
    [name, description, tagsInput, knobSettings, connections, sequenceNotes, audioUrl, isPublic, onSubmit],
  )

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

      {/* DFAM Panel — full width, horizontally scrollable on small screens */}
      <section>
        <DFAMPanel
          values={knobSettings}
          onChange={setKnobSettings}
          connections={connections}
          onConnectionsChange={setConnections}
        />
      </section>

      {/* Patch Bay — interactive cable management below the panel */}
      <section className="max-w-xl">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
          Patch Bay
        </div>
        <PatchBay connections={connections} onChange={setConnections} />
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

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/patch-form/PatchForm.tsx __tests__/components/PatchForm.test.tsx
git commit -m "feat: wire DFAMPanel into PatchForm, PatchBay below panel"
```

---

## Task 5: Delete KnobGrid

**Files:**
- Delete: `components/dfam/KnobGrid.tsx`
- Delete: `__tests__/components/KnobGrid.test.tsx`

- [ ] **Step 1: Confirm KnobGrid is no longer imported anywhere**

```bash
grep -r "KnobGrid" /Users/lacorte/Projects/repositories/PatchLib/components \
  /Users/lacorte/Projects/repositories/PatchLib/__tests__ \
  --include="*.tsx" --include="*.ts"
```
Expected: no output (only the KnobGrid files themselves, if grep includes them).

- [ ] **Step 2: Delete the files**

```bash
rm components/dfam/KnobGrid.tsx
rm __tests__/components/KnobGrid.test.tsx
```

- [ ] **Step 3: Run all tests to confirm nothing breaks**

```bash
npx jest --no-coverage
```
Expected: all tests pass (KnobGrid tests are gone, DFAMPanel tests replace them).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete KnobGrid replaced by DFAMPanel"
```

---

## Self-Review

**Spec coverage check:**
- ✅ DFAMPanel with 1000×430px absolute positioning — Task 3
- ✅ All 7 clusters (A–G) with correct pixel coordinates — Task 3
- ✅ WaveToggle restyled to vertical hardware lever — Task 1
- ✅ Knob disc color tweak — Task 2
- ✅ PatchBay visual strip in panel (read-only jack display) — Task 3
- ✅ PatchBay interactive cable management below panel — Task 4
- ✅ PatchForm updated — Task 4
- ✅ KnobGrid deleted — Task 5
- ✅ Tests updated — Tasks 1, 3, 4, 5

**Placeholder scan:** None found.

**Type consistency:** `Connection` interface defined inline in DFAMPanel matches `ConnectionFormValue` from `lib/types` — same shape `{ fromJack, toJack, color }`. `KnobValues = Record<string, number>` consistent throughout.
