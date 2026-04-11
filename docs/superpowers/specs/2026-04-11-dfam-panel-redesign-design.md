# DFAM Panel Redesign — Design Spec

## Goal

Replace the current block-grid layout of the DFAM patch form with a hardware-faithful panel that mirrors the physical Moog DFAM in layout and proportion — without reproducing any Moog brand marks.

---

## Visual Reference

Source: `dfam-v5.html` in `.superpowers/brainstorm/89768-1775884923/content/`

Panel: **1000 × 430 px**, charcoal background (`#1d1d1d`), cream labels, orange indicator lines on knobs, gold ring on output jacks, silver ring on input jacks.

---

## Architecture

### New component: `DFAMPanel.tsx`

Single `position: relative; width: 1000px; height: 430px` container. All controls positioned with `position: absolute`. Replaces `KnobGrid.tsx` as the view-layer for the patch form.

`KnobGrid.tsx` is **deleted**. `DFAMPanel` receives the same two props: `values: KnobValues` and `onChange: (values: KnobValues) => void`, plus `connections` / `onConnectionsChange` (currently passed to `PatchBay` separately) so the whole panel is one self-contained component.

Existing `Knob.tsx`, `WaveToggle.tsx`, `PatchBay.tsx` are **kept** but restyled/wrapped as described below.

---

## Layout — 7 Clusters

Coordinate origin: top-left of panel. All `left`/`top` values are pixel centers of the control disc.

### Cluster A — VCO / Pitch / FM (left side, two rows)

| Row | x px | Control | Type |
|-----|------|---------|------|
| Top | 55 | VCO DECAY | large knob (48px) |
| Top | 107 | SEQ PITCH MOD | 3-pos toggle |
| Top | 152 | VCO 1 EG AMT | large knob |
| Top | 218 | VCO 1 FREQ | large knob |
| Bot | 55 | 1-2 FM AMT | large knob |
| Bot | 107 | HARD SYNC | 2-pos toggle |
| Bot | 152 | VCO 2 EG AMT | large knob |
| Bot | 218 | VCO 2 FREQ | large knob |

Row 1 top: `top: 77px`. Row 2 top: `top: 172px`.

### Cluster B — Wave / Mixer (vertical strip)

Centered at `left: 305px` (switches) and `left: 348px` (small knobs 26px).
Five controls stacked vertically: VCO1 WAVE → VCO1 LEVEL → NOISE/EXT LVL → VCO2 WAVE → VCO2 LEVEL.

### Cluster C — Filter

Top row (`top: 77px`): VCF MODE switch at `left: 415px`, CUTOFF at `left: 460px`, RESONANCE at `left: 527px`.
Bottom row (`top: 172px`): VCF DECAY at `left: 460px`, VCF EG AMT at `left: 527px`.

### Cluster D — VCA / Output

Top row (`top: 77px`): VCA EG switch at `left: 615px`, VOLUME at `left: 660px`.
Bottom row (`top: 172px`): NOISE/VCF MOD at `left: 615px`, VCA DECAY at `left: 660px`.

### Cluster E — Transport

- TRIGGER button (circular 26px) at `left: 50px, top: 255px`
- TEMPO knob (large) at `left: 145px, top: 285px`
- RUN/STOP button at `left: 80px, top: 352px`
- ADVANCE button at `left: 175px, top: 352px`

### Cluster F — Sequencer (8 steps)

Step column centers: `x = 265, 340, 415, 491, 566, 641, 716, 792`.
Each column (top to bottom): step number · pitch small knob · LED dot · velocity small knob.
- Step numbers: `top: 230px`
- Pitch knobs: `top: 262px`
- LEDs: `top: 298px`
- Velocity knobs: `top: 330px`

### Cluster G — Patchbay (right strip, 16% of width)

Background: `#181818`. 3 jack columns at `left: 862, 906, 950px`. 8 rows at `top: 57, 104, 151, 198, 245, 292, 339, 386px`.
Jack appearance: 14px circle, `border: 2px solid #b09048` (output), `border: 2px solid #484848` (input). Label below (9px).

---

## Component Changes

### `Knob.tsx` — no logic change

Adjust knob disc fill to `#141414` (currently `#1a1a1a`) and outer stroke to `#303030`. Keep orange indicator line and drag interaction unchanged.

### `WaveToggle.tsx` — visual restyle to vertical toggle lever

The current segmented button doesn't look like a hardware toggle. Replace with a vertical rectangle body + sliding lever that positions at top / middle / bottom depending on value. Keep the same props and logic. Rename internal element classes only — no prop API change.

### `PatchBay.tsx` — compact panel mode

Add a `compact?: boolean` prop. When `compact={true}` the component renders only the 3×8 jack grid (no cable color picker header, no cable list). The parent `DFAMPanel` passes `compact` and renders the cable list / color picker below the panel in the normal page flow.

### `KnobGrid.tsx` — deleted

Replaced entirely by `DFAMPanel.tsx`.

---

## Panel Header / Footer

- **DFAM** title: `font-size: 18px`, bold, `letter-spacing: 6px`, top-left of panel.
- **"DRUMMER FROM ANOTHER MOTHER"** subtitle below in very small dim text (decorative, not Moog brand).
- Footer (bottom-left): serial-style text in dim cream (decorative).

---

## Responsive Behaviour

Panel is fixed 1000×430px. Wrapper uses `overflow-x: auto` so it scrolls on small screens. No responsive breakpoints inside the panel itself.

---

## Files Touched

| Action | File |
|--------|------|
| Create | `components/dfam/DFAMPanel.tsx` |
| Modify | `components/dfam/Knob.tsx` |
| Modify | `components/dfam/WaveToggle.tsx` |
| Modify | `components/dfam/PatchBay.tsx` |
| Delete | `components/dfam/KnobGrid.tsx` |
| Modify | wherever `KnobGrid` is imported (patch form page) |

---

## What Does NOT Change

- `lib/dfam.ts` — data model unchanged
- All tests — updated only to reflect renamed/replaced components
- Auth, DB, API routes — untouched
- `PatchBay` connection logic — untouched
- `Knob` drag interaction — untouched
