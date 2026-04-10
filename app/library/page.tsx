import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'
import { Nav } from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { search?: string; tags?: string }
}

async function LibraryPatchList({
  userId,
  search,
  activeTags,
}: {
  userId: string
  search: string
  activeTags: string[]
}) {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: {
      userId,
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
        No patches yet.{' '}
        <Link href="/library/new" className="text-orange-500 hover:text-orange-400">
          Create one?
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map(patch => (
        <PatchCard
          key={patch.id}
          patch={patch}
          variant="library"
          href={`/patches/${patch.id}`}
        />
      ))}
    </div>
  )
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { prisma } = await import('@/lib/prisma')
  const search = searchParams.search || ''
  const activeTags = searchParams.tags?.split(',').filter(Boolean) || []

  const [patchCount, allTags] = await Promise.all([
    prisma.patch.count({ where: { userId: session.user.id } }),
    prisma.patch
      .findMany({ where: { userId: session.user.id }, select: { tags: true } })
      .then(patches => Array.from(new Set(patches.flatMap(p => p.tags))).sort()),
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav activePage="library" />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            My Library · {patchCount} {patchCount === 1 ? 'patch' : 'patches'}
          </span>
          <Link
            href="/library/new"
            className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
          >
            + NEW PATCH
          </Link>
        </div>

        <Suspense>
          <SearchBar defaultValue={search} />
        </Suspense>

        {allTags.length > 0 && (
          <Suspense>
            <TagFilter tags={allTags} activeTags={activeTags} />
          </Suspense>
        )}

        <Suspense fallback={<p className="text-zinc-600 text-sm font-mono py-4">Loading…</p>}>
          <LibraryPatchList
            userId={session.user.id}
            search={search}
            activeTags={activeTags}
          />
        </Suspense>
      </main>
    </div>
  )
}
