'use client'

import { useState, useCallback } from 'react'
import { DFAM_KNOBS, DFAM_PATCH_POINTS, CABLE_COLORS } from '@/lib/dfam'
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

// Patchbay row tops (px) — 8 rows, scaled 1.3×
const JACK_ROWS = [74, 135, 196, 257, 319, 380, 441, 502]
// Jack column x positions within the 208px patchbay strip, scaled 1.3×
const JACK_COLS = [29, 86, 143]
// Sorted patch points: row asc, col asc
const SORTED_POINTS = [...DFAM_PATCH_POINTS].sort(
  (a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col,
)

const panelFont = "'Courier New', monospace"

// Abbreviated labels for patchbay jacks — avoids duplicate text with knob/button labels
const JACK_LABEL_OVERRIDES: Record<string, string> = {
  trigger_out: 'TRIG →',
  trigger_in:  '→ TRIG',
  vco_decay_in: 'VCO DEC',
  tempo_in: 'TEMPO →',
}

export function DFAMPanel({ values, onChange, connections, onConnectionsChange: _onConnectionsChange }: DFAMPanelProps) {
  const [triggerActive, setTriggerActive] = useState(false)
  const [runStop, setRunStop] = useState(false)
  const [advanceActive, setAdvanceActive] = useState(false)

  const handleChange = useCallback(
    (id: string, value: number) => onChange({ ...values, [id]: value }),
    [values, onChange],
  )

  const knobById = Object.fromEntries(DFAM_KNOBS.map(k => [k.id, k]))

  function kn(id: string, size = 62) {
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

  function C({ left, top, children }: { left: number; top: number; children: React.ReactNode }) {
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
          gap: 4,
          fontFamily: panelFont,
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          position: 'relative',
          width: 1300,
          height: 559,
          background: '#1d1d1d',
          border: '2px solid #3a3a3a',
          borderRadius: 6,
          boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
          fontFamily: panelFont,
        }}
      >
        {/* ── PANEL HEADER ─────────────────────────────────────────── */}
        <div style={{ position: 'absolute', left: 20, top: 10, display: 'flex', alignItems: 'baseline', gap: 13 }}>
          <span style={{ fontSize: 23, fontWeight: 900, letterSpacing: 8, color: '#e8e0cc', fontFamily: panelFont }}>
            DFAM
          </span>
          <span style={{ fontSize: 9, letterSpacing: 2, color: '#3a3028', fontFamily: panelFont }}>
            DRUMMER FROM ANOTHER MOTHER
          </span>
        </div>

        {/* ── PATCHBAY BACKGROUND STRIP ────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: 1092,
            top: 0,
            width: 208,
            height: 559,
            background: '#181818',
            borderLeft: '1px solid #2e2e2e',
          }}
        />

        {/* ── CLUSTER A: VCO / PITCH / FM ──────────────────────────── */}
        <C left={72}  top={100}>{kn('vco_decay')}</C>
        <C left={139} top={107}>{sw('seq_pitch_mod')}</C>
        <C left={198} top={100}>{kn('vco1_eg_amount')}</C>
        <C left={283} top={100}>{kn('vco1_freq')}</C>
        <C left={72}  top={224}>{kn('fm_1_2_amount')}</C>
        <C left={139} top={235}>{sw('hard_sync')}</C>
        <C left={198} top={224}>{kn('vco2_eg_amount')}</C>
        <C left={283} top={224}>{kn('vco2_freq')}</C>

        {/* ── CLUSTER B: WAVE / MIXER ──────────────────────────────── */}
        <C left={397} top={100}>{sw('vco1_wave')}</C>
        <C left={452} top={100}>{kn('vco1_level', 34)}</C>
        <C left={425} top={165}>{kn('noise_ext_level', 34)}</C>
        <C left={397} top={224}>{sw('vco2_wave')}</C>
        <C left={452} top={224}>{kn('vco2_level', 34)}</C>

        {/* ── CLUSTER C: FILTER ────────────────────────────────────── */}
        <C left={540} top={107}>{sw('vcf_mode')}</C>
        <C left={598} top={100}>{kn('vcf_cutoff')}</C>
        <C left={685} top={100}>{kn('vcf_resonance')}</C>
        <C left={598} top={224}>{kn('vcf_decay')}</C>
        <C left={685} top={224}>{kn('vcf_eg_amount')}</C>

        {/* ── CLUSTER D: VCA / OUTPUT ──────────────────────────────── */}
        <C left={800} top={107}>{sw('vca_eg')}</C>
        <C left={858} top={100}>{kn('volume')}</C>
        <C left={800} top={224}>{kn('noise_vcf_mod')}</C>
        <C left={858} top={224}>{kn('vca_decay')}</C>

        {/* ── CLUSTER E: TRANSPORT ─────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: 65,
            top: 332,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <button
            type="button"
            aria-label="Trigger"
            onPointerDown={() => setTriggerActive(true)}
            onPointerUp={() => setTriggerActive(false)}
            onPointerLeave={() => setTriggerActive(false)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: triggerActive ? '#e07b39' : '#252525',
              border: `1.5px solid ${triggerActive ? '#e07b39' : '#555'}`,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.7)',
            }}
          />
          <span style={{ fontSize: 12, color: '#c0b898', letterSpacing: 0.3 }}>TRIGGER</span>
        </div>

        <C left={189} top={371}>{kn('tempo')}</C>

        <div style={{ position: 'absolute', left: 104, top: 458, transform: 'translateX(-50%)' }}>
          <button
            type="button"
            onClick={() => setRunStop(r => !r)}
            style={{
              background: runStop ? '#e07b39' : '#181818',
              border: `1.5px solid ${runStop ? '#e07b39' : '#484848'}`,
              borderRadius: 9,
              padding: '4px 9px',
              fontSize: 12,
              color: runStop ? '#000' : '#7a7060',
              cursor: 'pointer',
              letterSpacing: 0.5,
              fontFamily: panelFont,
            }}
          >
            {runStop ? 'STOP' : 'RUN'}
          </button>
        </div>

        <div style={{ position: 'absolute', left: 228, top: 458, transform: 'translateX(-50%)' }}>
          <button
            type="button"
            onPointerDown={() => setAdvanceActive(true)}
            onPointerUp={() => setAdvanceActive(false)}
            onPointerLeave={() => setAdvanceActive(false)}
            style={{
              background: advanceActive ? '#e07b39' : '#181818',
              border: `1.5px solid ${advanceActive ? '#e07b39' : '#484848'}`,
              borderRadius: 9,
              padding: '4px 9px',
              fontSize: 12,
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
        {[345, 442, 540, 638, 736, 833, 931, 1030].map((x, i) => (
          <div key={i}>
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 299,
                transform: 'translateX(-50%)',
                fontSize: 12,
                color: '#7a7060',
                fontFamily: panelFont,
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 341,
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
                size={34}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 387,
                transform: 'translate(-50%, -50%)',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 429,
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
                size={34}
              />
            </div>
          </div>
        ))}

        {/* ── CLUSTER G: PATCHBAY VISUAL STRIP ─────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: 1178,
            top: 34,
            transform: 'translateX(-50%)',
            fontSize: 10,
            color: '#6a6050',
            letterSpacing: 1,
            fontFamily: panelFont,
          }}
        >
          IN / +
        </div>

        {SORTED_POINTS.map(point => {
          const stripPrefix = (jack: string) => jack.includes(':') ? jack.split(':')[1] : jack
          const connected = connections.find(
            c => stripPrefix(c.fromJack) === point.id || stripPrefix(c.toJack) === point.id,
          )
          const cableColor = connected
            ? (CABLE_COLORS.find(c => c.id === connected.color)?.hex ?? '#e07b39')
            : null
          const stripLeft = 1092 + JACK_COLS[point.col - 1]
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
                gap: 3,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#0b0b0b',
                  border: `2px solid ${point.direction === 'out' ? '#b09048' : '#484848'}`,
                  position: 'relative',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: cableColor ?? '#070707',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: '#6a6050',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                  fontFamily: panelFont,
                  maxWidth: 52,
                }}
              >
                {JACK_LABEL_OVERRIDES[point.id] ?? point.label}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
