'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'

interface TagFilterProps {
  tags: string[]
  activeTags: string[]
}

export function TagFilter({ tags, activeTags }: TagFilterProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function hrefForTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('tags')?.split(',').filter(Boolean) || []
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag]
    if (next.length > 0) {
      params.set('tags', next.join(','))
    } else {
      params.delete('tags')
    }
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => {
        const active = activeTags.includes(tag)
        return (
          <Link
            key={tag}
            href={hrefForTag(tag)}
            className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
              active
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tag}
          </Link>
        )
      })}
    </div>
  )
}
