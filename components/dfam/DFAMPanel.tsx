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

// Patchbay row tops (px) — 8 rows
const JACK_ROWS = [57, 104, 151, 198, 245, 292, 339, 386]
// Jack column x positions within the 160px patchbay strip
const JACK_COLS = [22, 66, 110]
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
          gap: 3,
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
        <C left={55}  top={77}>{kn('vco_decay')}</C>
        <C left={107} top={82}>{sw('seq_pitch_mod')}</C>
        <C left={152} top={77}>{kn('vco1_eg_amount')}</C>
        <C left={218} top={77}>{kn('vco1_freq')}</C>
        <C left={55}  top={172}>{kn('fm_1_2_amount')}</C>
        <C left={107} top={181}>{sw('hard_sync')}</C>
        <C left={152} top={172}>{kn('vco2_eg_amount')}</C>
        <C left={218} top={172}>{kn('vco2_freq')}</C>

        {/* ── CLUSTER B: WAVE / MIXER ──────────────────────────────── */}
        <C left={305} top={77}>{sw('vco1_wave')}</C>
        <C left={348} top={77}>{kn('vco1_level', 26)}</C>
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

        <C left={145} top={285}>{kn('tempo')}</C>

        <div style={{ position: 'absolute', left: 80, top: 352, transform: 'translateX(-50%)' }}>
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

        <div style={{ position: 'absolute', left: 175, top: 352, transform: 'translateX(-50%)' }}>
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
                {JACK_LABEL_OVERRIDES[point.id] ?? point.label}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
