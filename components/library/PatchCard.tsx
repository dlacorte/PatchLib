import Link from 'next/link'
import type { PatchListItem } from '@/lib/types'

interface PatchCardProps {
  patch: PatchListItem
  variant?: 'discovery' | 'library'
  href?: string
}

function ownerName(user: { displayName: string | null; email: string }): string {
  return user.displayName ?? user.email.split('@')[0]
}

export function PatchCard({ patch, variant = 'discovery', href }: PatchCardProps) {
  const date = new Date(patch.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={href ?? `/patches/${patch.id}`}
      className="block bg-[#111] border border-zinc-800 rounded px-4 py-3 hover:border-zinc-600 hover:bg-[#161616] transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-sm text-zinc-100 group-hover:text-white truncate">
              {patch.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 rounded px-1 py-0 flex-shrink-0">
              {patch.device}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-600">
            <span>{patch._count.connections} cables</span>
            {patch.audioUrl && <span className="text-zinc-500" title="Has audio">♪</span>}
            {variant === 'discovery' && (
              <span className="text-zinc-500">by {ownerName(patch.user)}</span>
            )}
            {patch.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {patch.tags.map(tag => (
                  <span key={tag} className="text-zinc-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {variant === 'library' && (
            <span
              className={`text-[10px] font-mono border rounded px-1.5 py-0 ${
                patch.isPublic
                  ? 'text-green-600 border-green-900'
                  : 'text-zinc-600 border-zinc-800'
              }`}
            >
              {patch.isPublic ? 'public' : 'private'}
            </span>
          )}
          <span className="text-[11px] text-zinc-600 font-mono">{date}</span>
        </div>
      </div>
    </Link>
  )
}
