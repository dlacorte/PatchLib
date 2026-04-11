# Cable Visualization — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

---

## Goal

Render patch cables as visual Bezier curves directly on the DFAM/XFAM hardware panels. Jacks on the panel become clickable. Cross-device cables connect panels with a dashed bridge line. The existing PatchBay list stays as an alternative interaction point.

---

## User-Facing Behaviour

- **Click any jack** on the panel → jack glows orange (pending)
- **Click a second jack** → cable appears as a Bezier curve between the two jacks
- **Any combination** allowed: out→in, in→in, out→out (no direction enforcement)
- **Click an existing cable** → it highlights red + a "Remove" button appears
- **Click same jack again** → cancels pending state
- **PatchBay** (grid/list below panel) still works as a second way to create/remove connections — both write to the same `connections` state
- **Cross-device cable** (DFAM→XFAM): half-curve exits bottom of source panel → dashed bridge in the gap → half-curve enters top of target panel

---

## Architecture

### New: `getJackCoords(point: PatchPointDef): { x: number; y: number }`

Added to `lib/dfam.ts`. Maps `point.row` / `point.col` to pixel coordinates using the existing `JACK_ROWS` / `JACK_COLS` constants already in `DFAMPanel.tsx`. Returns the centre of the jack socket in panel-local coordinates.

### Modified: `DFAMPanel.tsx`

**SVG overlay** — a `<svg>` with `position: absolute, top: 0, left: 0, width: 1300, height: 559` sits on top of the panel. `pointerEvents: 'none'` on the SVG itself; individual elements inside use `pointerEvents: 'all'`.

**Contents of the SVG:**

1. **Cable paths** — one `<path>` per connection where both jacks belong to this device. Bezier sag formula: `C x1 (y1+sag) x2 (y2+sag) x2 y2`, sag = `clamp(distance × 0.3, 20, 80)`. A wider transparent hit-area path sits on top for click detection.

2. **Half-cable exits** — for cross-device connections originating here: curve from the source jack to the bottom-centre edge of the panel, ending with a small colored dot.

3. **Half-cable entries** — for cross-device connections terminating here: curve from the top-centre edge to the target jack, starting with a small colored dot.

4. **Jack overlay buttons** — invisible `<circle>` elements centred on each jack with `r=14`, `pointerEvents: 'all'`, `fill: transparent`. They capture clicks without obscuring the visual jack beneath.

**Interaction state** (local to `DFAMPanel`):

```ts
pendingJack: string | null    // prefixed ID of first-clicked jack
selectedCable: number | null  // index into connections[] of selected cable
```

### New: `PanelStack.tsx`

Wrapper component rendered once in `PatchForm` when multiple devices are selected. Renders:
- One `DFAMPanel` per device (stacked vertically with `gap: 16px`)
- For each cross-device connection: a narrow SVG strip between the two panels containing a dashed colored line from the bottom-edge dot of the source panel to the top-edge dot of the target panel

`PanelStack` receives `devices`, `knobSettings`, `connections`, `onChange`, `onConnectionsChange` and distributes them to child panels.

### Unchanged: `PatchBay.tsx`

No changes. Still works as an alternative cable interaction. Both `DFAMPanel` and `PatchBay` receive the same `connections` prop and call the same `onConnectionsChange` callback from `PatchForm`.

### Unchanged: `DFAMPanelStatic.tsx`

Wraps `DFAMPanel` with no-op handlers — SVG cables render read-only automatically.

---

## Cable Rendering Detail

```
Sag = clamp(|distance| × 0.3, 20, 80)
Path = "M x1 y1 C x1 (y1+sag) x2 (y2+sag) x2 y2"
```

- **Normal:** stroke = cable color, stroke-width = 2.5, opacity = 1  
- **Selected:** stroke = `#ef4444`, + dashed ring around both endpoint jacks  
- **Hit area:** same path, stroke-width = 12, opacity = 0, pointerEvents = 'all'  
- **Pending jack:** orange glow ring `r=14`, pulsing opacity animation

---

## Cross-Device Bridge Detail

Source jack exit point: `(jackX, 559)` — the jack's x coordinate at the bottom edge of the source panel.  
Target jack entry point: `(jackX, 0)` — the target jack's x coordinate at the top edge of the target panel.

Each half-cable curves from its jack to its edge point. `PanelStack` renders a `16px`-tall SVG strip between panels:
```
<line x1={sourceJackX} y1="0" x2={targetJackX} y2="16"
      stroke={cableColor} strokeDasharray="4 3" strokeWidth="2" />
```
If source and target x coordinates differ significantly, the line is diagonal — this is intentional and makes the routing clear.

---

## Files Changed

| Action | File | What changes |
|--------|------|-------------|
| Modify | `lib/dfam.ts` | Add `getJackCoords()` |
| Modify | `components/dfam/DFAMPanel.tsx` | SVG overlay, jack click handlers, cable rendering |
| Create | `components/dfam/PanelStack.tsx` | Multi-panel wrapper + cross-device bridge |
| Modify | `components/patch-form/PatchForm.tsx` | Use `PanelStack` instead of raw `DFAMPanel` loop |
| Modify | `__tests__/components/PatchForm.test.tsx` | Update mock for PanelStack |

---

## Testing

- `getJackCoords` — unit tests: known row/col → expected pixel coordinates
- `DFAMPanel` interaction — click jack A then B → `onConnectionsChange` called with correct connection; click cable → selected; click delete → connection removed
- `PanelStack` — renders one panel per device; renders bridge SVG for cross-device connection
- Visual: manual test with DFAM+XFAM — cables appear on panel, dashed bridge between panels, PatchBay list stays in sync

---

## Out of Scope

- Cable physics / animation (no dragging, no wiggle)
- Audio signal flow visualization
- More than 2 devices simultaneously
