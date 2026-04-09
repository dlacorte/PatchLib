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

export function KnobGrid({ values, onChange }: KnobGridProps) {
  const [seqOpen, setSeqOpen] = useState(true)

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
      />
    )
  }

  const vco1Knobs = DFAM_KNOBS.filter(k => k.section === 'oscillators' && k.id.startsWith('vco1'))
  const vco2Knobs = DFAM_KNOBS.filter(k => k.section === 'oscillators' && k.id.startsWith('vco2'))
  const noiseKnobs = DFAM_KNOBS.filter(k => k.section === 'noise')
  const envelopeKnobs = DFAM_KNOBS.filter(k => k.section === 'envelope')
  const filterKnobs = DFAM_KNOBS.filter(k => k.section === 'filter')
  const tempoKnob = DFAM_KNOBS.find(k => k.id === 'tempo')!

  return (
    <div className="space-y-4">

      {/* Oscillators */}
      <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-4">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 pb-1 border-b border-zinc-800">
          Oscillators
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-3 font-mono">VCO 1</div>
            <div className="flex flex-wrap gap-4">{vco1Knobs.map(renderControl)}</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-3 font-mono">VCO 2</div>
            <div className="flex flex-wrap gap-4">{vco2Knobs.map(renderControl)}</div>
          </div>
        </div>
      </div>

      {/* Noise / Envelope / Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 pb-1 border-b border-zinc-800">
            Noise
          </div>
          <div className="flex flex-wrap gap-4">{noiseKnobs.map(renderControl)}</div>
        </div>

        <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 pb-1 border-b border-zinc-800">
            Envelope
          </div>
          <div className="flex flex-wrap gap-4">{envelopeKnobs.map(renderControl)}</div>
        </div>

        <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-4">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 pb-1 border-b border-zinc-800">
            Filter
          </div>
          <div className="flex flex-wrap gap-4">{filterKnobs.map(renderControl)}</div>
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
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded p-4">
            <div className="flex items-start gap-8 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <Knob
                  id={tempoKnob.id}
                  label={tempoKnob.label}
                  value={values[tempoKnob.id] ?? tempoKnob.defaultValue}
                  onChange={handleChange}
                />
              </div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
