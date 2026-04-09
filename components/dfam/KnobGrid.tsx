'use client'

import { useState, useCallback } from 'react'
import { DFAM_KNOBS, SEQUENCER_STEPS, type KnobDef } from '@/lib/dfam'
import { Knob } from './Knob'
import { WaveToggle } from './WaveToggle'

type KnobValues = Record<string, number>

interface KnobGridProps {
  values: KnobValues
  onChange: (values: KnobValues) => void
}

function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-[3px] pb-1 mb-3 border-b border-zinc-800/60">
      {children}
    </div>
  )
}

function BlockLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mb-3">
      {children}
    </div>
  )
}

function BlockWell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0d0d0d] border border-zinc-800/70 rounded p-3 ${className}`}>
      {children}
    </div>
  )
}

export function KnobGrid({ values, onChange }: KnobGridProps) {
  const [seqOpen, setSeqOpen] = useState(true)
  const [triggerActive, setTriggerActive] = useState(false)
  const [runStop, setRunStop] = useState(false)
  const [advanceActive, setAdvanceActive] = useState(false)

  const handleChange = useCallback(
    (id: string, value: number) => onChange({ ...values, [id]: value }),
    [values, onChange],
  )

  function renderControl(k: KnobDef) {
    if (k.type === 'switch') {
      return (
        <WaveToggle
          key={k.id}
          id={k.id}
          label={k.label}
          value={values[k.id] ?? k.defaultValue}
          onChange={handleChange}
          options={k.options ?? ['OFF', 'ON']}
        />
      )
    }
    return (
      <Knob
        key={k.id}
        id={k.id}
        label={k.label}
        value={values[k.id] ?? k.defaultValue}
        onChange={handleChange}
        min={k.min}
        max={k.max}
      />
    )
  }

  const knobById  = Object.fromEntries(DFAM_KNOBS.map(k => [k.id, k]))
  const tempoKnob = DFAM_KNOBS.find(k => k.id === 'tempo')!

  // LEFT BLOCK — Pitch + FM + Sync: exact 2×4 grid
  // Row 1: VCO DECAY | SEQ PITCH MOD | VCO 1 EG AMT | VCO 1 FREQ
  // Row 2: 1-2 FM AMT | HARD SYNC    | VCO 2 EG AMT | VCO 2 FREQ
  const pitchRow1 = ['vco_decay', 'seq_pitch_mod', 'vco1_eg_amount', 'vco1_freq']
  const pitchRow2 = ['fm_1_2_amount', 'hard_sync', 'vco2_eg_amount', 'vco2_freq']

  return (
    <div className="space-y-5">

      {/* ── ZONE 1: SOUND ENGINE ───────────────────────────────────── */}
      <div>
        <ZoneLabel>Sound Engine</ZoneLabel>

        {/* No wrap — scroll horizontally on small screens */}
        <div className="flex gap-2 overflow-x-auto pb-1">

          {/* Block 1 — Pitch + FM + Sync: 2×4 grid */}
          <BlockWell className="flex-none">
            <BlockLabel>Pitch · FM · Sync</BlockLabel>
            <div className="grid grid-cols-4 gap-x-4 gap-y-4">
              {pitchRow1.map(id => renderControl(knobById[id]))}
              {pitchRow2.map(id => renderControl(knobById[id]))}
            </div>
          </BlockWell>

          {/* Block 2 — Wave + Mixer: VCO1 row / VCO2 row / noise centered */}
          <BlockWell className="flex-none">
            <BlockLabel>Wave · Mixer</BlockLabel>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {renderControl(knobById['vco1_wave'])}
              {renderControl(knobById['vco1_level'])}
              {renderControl(knobById['vco2_wave'])}
              {renderControl(knobById['vco2_level'])}
            </div>
            <div className="mt-3 flex justify-center">
              {renderControl(knobById['noise_ext_level'])}
            </div>
          </BlockWell>

          {/* Block 3 — Filter: switch at top, 2×2 knob grid below */}
          <BlockWell className="flex-none">
            <BlockLabel>Filter</BlockLabel>
            <div className="flex justify-center mb-3">
              {renderControl(knobById['vcf_mode'])}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {renderControl(knobById['vcf_cutoff'])}
              {renderControl(knobById['vcf_resonance'])}
              {renderControl(knobById['vcf_decay'])}
              {renderControl(knobById['vcf_eg_amount'])}
            </div>
          </BlockWell>

          {/* Block 4 — Mod + VCA: switch + knobs in 2×2 grid */}
          <BlockWell className="flex-none">
            <BlockLabel>Mod · VCA</BlockLabel>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {renderControl(knobById['vca_eg'])}
              {renderControl(knobById['volume'])}
              {renderControl(knobById['noise_vcf_mod'])}
              {renderControl(knobById['vca_decay'])}
            </div>
          </BlockWell>

        </div>
      </div>

      {/* ── ZONE 2: SEQUENCER ─────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setSeqOpen(o => !o)}
          className="w-full text-left flex items-center justify-between text-[9px] font-mono text-zinc-600 uppercase tracking-[3px] pb-1 mb-3 border-b border-zinc-800/60"
        >
          <span>Sequencer</span>
          <span className="text-zinc-700">{seqOpen ? '▲' : '▼'}</span>
        </button>

        {seqOpen && (
          <BlockWell>
            <div className="flex gap-6 items-start">

              {/* Transport (top) + Tempo (bottom) — matches hardware order */}
              <div className="flex flex-col gap-1.5 flex-none">
                <button
                  type="button"
                  onPointerDown={() => setTriggerActive(true)}
                  onPointerUp={() => setTriggerActive(false)}
                  onPointerLeave={() => setTriggerActive(false)}
                  className={`px-2 py-1 text-[8px] font-mono font-bold rounded border transition-colors select-none ${
                    triggerActive
                      ? 'bg-orange-500 text-black border-orange-500'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  TRIGGER
                </button>
                <button
                  type="button"
                  onClick={() => setRunStop(r => !r)}
                  className={`px-2 py-1 text-[8px] font-mono font-bold rounded border transition-colors select-none ${
                    runStop
                      ? 'bg-orange-500 text-black border-orange-500'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {runStop ? 'STOP' : 'RUN'}
                </button>
                <button
                  type="button"
                  onPointerDown={() => setAdvanceActive(true)}
                  onPointerUp={() => setAdvanceActive(false)}
                  onPointerLeave={() => setAdvanceActive(false)}
                  className={`px-2 py-1 text-[8px] font-mono font-bold rounded border transition-colors select-none ${
                    advanceActive
                      ? 'bg-orange-500 text-black border-orange-500'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  ADVANCE
                </button>
                <div className="mt-2 flex justify-center">
                  <Knob
                    id={tempoKnob.id}
                    label={tempoKnob.label}
                    value={values[tempoKnob.id] ?? tempoKnob.defaultValue}
                    onChange={handleChange}
                    min={tempoKnob.min}
                    max={tempoKnob.max}
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="w-px self-stretch bg-zinc-800/60 flex-none" />

              {/* 8 step columns — Pitch (top) · Velocity (bottom) · Step LED */}
              <div className="grid grid-cols-8 gap-3 flex-1">
                {Array.from({ length: SEQUENCER_STEPS }, (_, i) => i + 1).map(step => (
                  <div key={step} className="flex flex-col items-center gap-2">
                    <span className="text-[8px] text-zinc-700 font-mono">{step}</span>
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
                    {/* Step LED indicator */}
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700/60" />
                  </div>
                ))}
              </div>

            </div>
          </BlockWell>
        )}
      </div>

    </div>
  )
}
