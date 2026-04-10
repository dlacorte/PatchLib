import { Suspense } from 'react'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'
import { Nav } from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: { search?: string; tags?: string }
}

async function PatchList({ search, activeTags }: { search: string; activeTags: string[] }) {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: {
      isPublic: true,
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
    include: {
      _count: { select: { connections: true } },
      user: { select: { displayName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (patches.length === 0) {
    return (
      <p className="text-zinc-600 text-sm font-mono py-12 text-center">
        No public patches yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map(patch => (
        <PatchCard key={patch.id} patch={patch} variant="discovery" />
      ))}
    </div>
  )
}

async function getAllPublicTags(): Promise<string[]> {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: { isPublic: true },
    select: { tags: true },
  })
  return Array.from(new Set(patches.flatMap(p => p.tags))).sort()
}

export default async function DiscoveryPage({ searchParams }: PageProps) {
  const search = searchParams.search || ''
  const activeTags = searchParams.tags?.split(',').filter(Boolean) || []
  const allTags = await getAllPublicTags()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav activePage="browse" />

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
