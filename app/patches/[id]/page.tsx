import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DFAM_PATCH_POINTS, CABLE_COLORS, DFAM_KNOBS } from '@/lib/dfam'
import { DeletePatchButton } from '@/components/patch-form/DeletePatchButton'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import { auth } from '@/auth'
import { CopyButton } from '@/components/auth/CopyButton'

interface PageProps {
  params: { id: string }
}

function colorHex(colorId: string): string {
  return CABLE_COLORS.find(c => c.id === colorId)?.hex ?? '#e07b39'
}

export default async function PatchDetailPage({ params }: PageProps) {
  const [patch, session] = await Promise.all([
    prisma.patch.findUnique({
      where: { id: params.id },
      include: { knobSettings: true, connections: true },
    }),
    auth(),
  ])

  if (!patch) notFound()
  // Public-only — private patches return 404 to anyone who isn't the owner
  if (!patch.isPublic && patch.userId !== session?.user?.id) notFound()

  const date = new Date(patch.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const knobMap = Object.fromEntries(patch.knobSettings.map(k => [k.knobId, k.value]))
  const displayKnobs = DFAM_KNOBS.filter(
    def => knobMap[def.id] !== undefined && knobMap[def.id] !== def.defaultValue,
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          PATCHLIB
        </Link>
        <div className="flex items-center gap-2">
          {/* Owner controls: edit + delete */}
          {session?.user?.id === patch.userId && (
            <>
              <Link
                href={`/library/${patch.id}/edit`}
                className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
              >
                Edit
              </Link>
              <DeletePatchButton patchId={patch.id} />
            </>
          )}
          {/* Copy button — shown on public patches not owned by current user */}
          {patch.isPublic && session?.user?.id !== patch.userId && (
            <CopyButton
              patchId={patch.id}
              className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
            />
          )}
          {/* Sign in — shown to guests on public patches */}
          {!session && patch.isPublic && (
            <Link
              href={`/login?callbackUrl=/patches/${patch.id}`}
              className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-mono font-bold text-zinc-100 mb-1">{patch.name}</h1>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span className="border border-zinc-700 rounded px-1.5 py-0.5">{patch.device}</span>
            <span>{date}</span>
          </div>
          {patch.description && (
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{patch.description}</p>
          )}
          {patch.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {patch.tags.map(tag => (
                <span key={tag} className="text-[11px] font-mono px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Knob settings */}
        {displayKnobs.length > 0 && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
              Knob Settings
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {displayKnobs.map(def => (
                <div key={def.id} className="flex items-center justify-between bg-[#111] border border-zinc-800 rounded px-3 py-2">
                  <span className="text-[11px] font-mono text-zinc-500">{def.label}</span>
                  <span className="text-sm font-mono font-bold text-orange-400">
                    {knobMap[def.id].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Patch bay connections */}
        {patch.connections.length > 0 && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
              Patch Bay · {patch.connections.length} cable{patch.connections.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-1.5">
              {patch.connections.map((conn, i) => {
                const from = DFAM_PATCH_POINTS.find(p => p.id === conn.fromJack)
                const to = DFAM_PATCH_POINTS.find(p => p.id === conn.toJack)
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colorHex(conn.color) }} />
                    <span className="text-orange-400/70">{from?.label ?? conn.fromJack}</span>
                    <span className="text-zinc-700">→</span>
                    <span>{to?.label ?? conn.toJack}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Notes */}
        {patch.sequenceNotes && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">Notes</div>
            <p className="text-sm font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">{patch.sequenceNotes}</p>
          </section>
        )}

        {patch.audioUrl && (
          <section>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">
              Audio
            </div>
            <AudioPlayer
              src={patch.audioUrl}
              filename={patch.audioUrl.split('/').pop()}
            />
          </section>
        )}

        {/* Copy banner — shown on public patches not owned by current user */}
        {patch.isPublic && session?.user?.id !== patch.userId && (
          <div className="flex items-center justify-between bg-[#111] border border-zinc-800 rounded px-4 py-3">
            <span className="text-xs font-mono text-zinc-500">Save this patch to your library</span>
            <CopyButton
              patchId={patch.id}
              label="Copy to my library"
              className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-500 transition-colors"
            />
          </div>
        )}
      </main>
    </div>
  )
}
