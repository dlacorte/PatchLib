'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues } from '@/lib/types'

interface EditPatchClientProps {
  patchId: string
  defaultValues: PatchFormValues
}

export function EditPatchClient({ patchId, defaultValues }: EditPatchClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (values: PatchFormValues) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const knobSettings = Object.entries(values.knobSettings).map(([knobId, value]) => ({
          knobId,
          value,
        }))
        const res = await fetch(`/api/patches/${patchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, knobSettings }),
        })
        if (!res.ok) throw new Error('Failed to update patch')
        router.push(`/patches/${patchId}`)
        router.refresh()
      } catch {
        setError('Something went wrong. Please try again.')
        setIsSubmitting(false)
      }
    },
    [patchId, router],
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/library" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          ← MY LIBRARY
        </Link>
        <span className="text-xs font-mono text-zinc-500">Edit Patch</span>
      </nav>
      <main className="px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm font-mono border border-red-900/50 rounded px-4 py-2">
            {error}
          </div>
        )}
        <PatchForm defaultValues={defaultValues} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>
    </div>
  )
}
