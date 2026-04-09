import { Suspense } from 'react'
import Link from 'next/link'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: { search?: string; tags?: string }
}

async function PatchList({ search, activeTags }: { search: string; activeTags: string[] }) {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        activeTags.length > 0 ? { tags: { hasSome: activeTags } } : {},
      ],
    },
    include: { _count: { select: { connections: true } } },
    orderBy: { createdAt: 'desc' },
  })

  if (patches.length === 0) {
    return (
      <p className="text-zinc-600 text-sm font-mono py-12 text-center">
        No patches found.{' '}
        <Link href="/patches/new" className="text-orange-500 hover:text-orange-400">
          Create one?
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map(patch => (
        <PatchCard key={patch.id} patch={patch} />
      ))}
    </div>
  )
}

async function getAllTags(): Promise<string[]> {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({ select: { tags: true } })
  return Array.from(new Set(patches.flatMap(p => p.tags))).sort()
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const search = searchParams.search || ''
  const activeTags = searchParams.tags?.split(',').filter(Boolean) || []
  const allTags = await getAllTags()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <span className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">PATCHLIB</span>
        <Link
          href="/patches/new"
          className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
        >
          + NEW PATCH
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <Suspense>
          <SearchBar defaultValue={search} />
        </Suspense>

        {allTags.length > 0 && (
          <Suspense>
            <TagFilter tags={allTags} activeTags={activeTags} />
          </Suspense>
        )}

        <Suspense fallback={<p className="text-zinc-600 text-sm font-mono py-4">Loading…</p>}>
          <PatchList search={search} activeTags={activeTags} />
        </Suspense>
      </main>
    </div>
  )
}
