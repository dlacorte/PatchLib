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
