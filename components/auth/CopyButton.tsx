'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

interface CopyButtonProps {
  patchId: string
  className?: string
  label?: string
}

export function CopyButton({ patchId, className, label = 'Copy' }: CopyButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCopy = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/patches/${patchId}`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/patches/copy/${patchId}`, { method: 'POST' })
      if (res.ok) {
        router.push('/library')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className={className}
    >
      {loading ? 'Copying…' : label}
    </button>
  )
}
