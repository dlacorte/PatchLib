'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues, PatchWithRelations } from '@/lib/types'

function patchToFormValues(patch: PatchWithRelations): PatchFormValues {
  const knobSettings = Object.fromEntries(
    patch.knobSettings.map(k => [k.knobId, k.value]),
  )
  return {
    name: patch.name,
    description: patch.description ?? '',
    tags: patch.tags,
    knobSettings,
    connections: patch.connections.map(c => ({
      fromJack: c.fromJack,
      toJack: c.toJack,
      color: c.color,
    })),
    sequenceNotes: patch.sequenceNotes ?? '',
    audioUrl: patch.audioUrl ?? '',
  }
}

export default function EditPatchPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [patch, setPatch] = useState<PatchWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/patches/${params.id}`)
      .then(r => r.json())
      .then(setPatch)
      .catch(() => setError('Failed to load patch'))
  }, [params.id])

  const handleSubmit = useCallback(
    async (values: PatchFormValues) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const knobSettings = Object.entries(values.knobSettings).map(([knobId, value]) => ({
          knobId,
          value,
        }))
        const res = await fetch(`/api/patches/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, knobSettings }),
        })
        if (!res.ok) throw new Error('Failed to update patch')
        router.push(`/patches/${params.id}`)
        router.refresh()
      } catch {
        setError('Something went wrong. Please try again.')
        setIsSubmitting(false)
      }
    },
    [params.id, router],
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          PATCHLIB
        </Link>
        <span className="text-xs font-mono text-zinc-500">Edit Patch</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm font-mono border border-red-900/50 rounded px-4 py-2">
            {error}
          </div>
        )}
        {!patch ? (
          <p className="text-zinc-600 font-mono text-sm">Loading…</p>
        ) : (
          <PatchForm
            defaultValues={patchToFormValues(patch)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  )
}
