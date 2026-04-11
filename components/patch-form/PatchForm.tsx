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
