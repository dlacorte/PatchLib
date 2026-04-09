'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeletePatchButton({ patchId }: { patchId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)

  async function handleDelete() {
    await fetch(`/api/patches/${patchId}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          className="text-xs font-mono text-red-400 border border-red-900/50 rounded px-2 py-1 hover:bg-red-950/50 transition-colors"
        >
          Confirm delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-mono text-zinc-500 px-2 py-1"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-mono text-zinc-500 border border-zinc-800 rounded px-2 py-1 hover:text-red-400 hover:border-red-900/50 transition-colors"
    >
      Delete
    </button>
  )
}
