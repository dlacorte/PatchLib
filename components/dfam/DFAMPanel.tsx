'use client'

import { useState, useCallback } from 'react'
import { DFAM_KNOBS, DFAM_PATCH_POINTS, CABLE_COLORS, JACK_ROWS, JACK_COLS, PATCHBAY_LEFT } from '@/lib/dfam'
import { prefixJackId } from '@/lib/devices'
import type { ConnectionFormValue } from '@/lib/types'
import { Knob } from './Knob'
import { WaveToggle } from './WaveToggle'
import { CableSVG } from './CableSVG'

type KnobValues = Record<string, number>

interface DFAMPanelProps {
  values: KnobValues
  onChange: (values: KnobValues) => void
  connections: ConnectionFormValue[]
  onConnectionsChange: (connections: ConnectionFormValue[]) => void
  deviceId?: string
  readonly?: boolean
}

const SORTED_POINTS = [...DFAM_PATCH_POINTS].sort(
  (a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col,
)

const knobById = Object.fromEntries(DFAM_KNOBS.map(k => [k.id, k]))

const panelFont = "'Courier New', monospace"

const JACK_LABEL_OVERRIDES: Record<string, string> = {
  trigger_out: 'TRIG →',
  trigger_in:  '→ TRIG',
  vco_decay_in: 'VCO DEC',
  tempo_in: 'TEMPO →',
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

export function DFAMPanel({
  values,
  onChange,
  connections,
  onConnectionsChange,
  deviceId = 'DFAM',
  readonly = false,
}: DFAMPanelProps) {
  const [triggerActive, setTriggerActive] = useState(false)
  const [runStop, setRunStop] = useState(false)
  const [advanceActive, setAdvanceActive] = useState(false)
  const [pendingJack, setPendingJack] = useState<string | null>(null)
  const [selectedCable, setSelectedCable] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState('orange')

  const handleChange = useCallback(
    (id: string, value: number) => onChange({ ...values, [id]: value }),
    [values, onChange],
  )

  const handleJackClick = useCallback(
    (jackId: string) => {
      setSelectedCable(null)
      if (pendingJack === jackId) {
        setPendingJack(null)
        return
      }
      if (pendingJack === null) {
        setPendingJack(jackId)
        return
      }
      const exists = connections.some(
        c =>
          (c.fromJack === pendingJack && c.toJack === jackId) ||
          (c.fromJack === jackId && c.toJack === pendingJack),
      )
      if (!exists) {
        onConnectionsChange([...connections, { fromJack: pendingJack, toJack: jackId, color: selectedColor }])
      }
      setPendingJack(null)
    },
    [pendingJack, selectedColor, connections, onConnectionsChange],
  )

  const handleCableSelect = useCallback((i: number) => {
    setPendingJack(null)
    setSelectedCable(prev => (prev === i ? null : i))
  }, [])

  const handleCableDelete = useCallback(() => {
    if (selectedCable === null) return
    onConnectionsChange(connections.filter((_, i) => i !== selectedCable))
    setSelectedCable(null)
  }, [selectedCable, connections, onConnectionsChange])

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

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Color picker + status bar */}
      {!readonly && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, height: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#6a6050', letterSpacing: 1, fontFamily: panelFont, textTransform: 'uppercase' }}>
              Cable:
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              {CABLE_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: c.hex,
                    border: selectedColor === c.id ? '2px solid #fff' : '2px solid transparent',
                    transform: selectedColor === c.id ? 'scale(1.25)' : 'scale(1)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label={`${c.label} cable`}
                />
              ))}
            </div>
          </div>
          {pendingJack && (
            <span style={{ fontSize: 10, color: '#e07b39', fontFamily: panelFont }}>
              Click a second jack to connect — or click the same jack to cancel
            </span>
          )}
          {selectedCable !== null && (
            <button
              type="button"
              onClick={handleCableDelete}
              style={{
                fontSize: 10,
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 4,
                padding: '2px 8px',
                background: 'rgba(239,68,68,0.08)',
                cursor: 'pointer',
                fontFamily: panelFont,
              }}
            >
              Remove cable
            </button>
          )}
        </div>
      )}

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
            {deviceId}
          </span>
          <span style={{ fontSize: 9, letterSpacing: 2, color: '#3a3028', fontFamily: panelFont }}>
            DRUMMER FROM ANOTHER MOTHER
          </span>
        </div>

        {/* ── PATCHBAY BACKGROUND STRIP ────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            left: PATCHBAY_LEFT,
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
          const prefixedId = prefixJackId(deviceId, point.id)
          const connected = connections.find(
            c => c.fromJack === prefixedId || c.toJack === prefixedId,
          )
          const cableColor = connected
            ? (CABLE_COLORS.find(c => c.id === connected.color)?.hex ?? '#e07b39')
            : null
          const stripLeft = PATCHBAY_LEFT + JACK_COLS[point.col - 1]
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

        {/* ── SVG cable overlay ─────────────────────────────────────── */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1300,
            height: 559,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <CableSVG
            deviceId={deviceId}
            connections={connections}
            pendingJack={pendingJack}
            selectedCable={selectedCable}
            selectedColor={selectedColor}
            onJackClick={handleJackClick}
            onCableSelect={handleCableSelect}
            readonly={readonly}
          />
        </svg>
      </div>
    </div>
  )
}
