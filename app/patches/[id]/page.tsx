import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DFAM_KNOBS } from '@/lib/dfam'
import { DeletePatchButton } from '@/components/patch-form/DeletePatchButton'
import { AudioPlayer } from '@/components/audio/AudioPlayer'
import { auth } from '@/auth'
import { CopyButton } from '@/components/auth/CopyButton'
import { DFAMPanelStatic } from '@/components/dfam/DFAMPanelStatic'

interface PageProps {
  params: { id: string }
}

const SECTION_LABELS: Record<string, string> = {
  pitch_fm_sync: 'VCO / Pitch / FM',
  wave_mixer:    'Wave / Mixer',
  filter:        'Filter',
  mod_vca:       'VCA / Output',
  sequencer:     'Sequencer',
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
  if (!patch.isPublic && patch.userId !== session?.user?.id) notFound()

  const date = new Date(patch.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Build per-device values map
  const valuesByDevice: Record<string, Record<string, number>> = {}
  for (const k of patch.knobSettings) {
    if (!valuesByDevice[k.device]) valuesByDevice[k.device] = {}
    valuesByDevice[k.device][k.knobId] = k.value
  }

  // Connections (already prefixed)
  const connections = patch.connections.map(c => ({
    fromJack: c.fromJack,
    toJack: c.toJack,
    color: c.color,
  }))

  const deviceList = patch.devices as string[]
  const sections = Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          PATCHLIB
        </Link>
        <div className="flex items-center gap-2">
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
          {patch.isPublic && session?.user?.id !== patch.userId && (
            <CopyButton
              patchId={patch.id}
              className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
            />
          )}
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

      <main className="py-8 space-y-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-2xl font-mono font-bold text-zinc-100 mb-1">{patch.name}</h1>
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
            <span className="border border-zinc-700 rounded px-1.5 py-0.5">{deviceList.join(' + ')}</span>
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

        {/* One DFAMPanelStatic per device */}
        {deviceList.map(deviceId => (
          <div key={deviceId} className="px-6">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3 max-w-3xl mx-auto">
              {deviceId}
            </div>
            <DFAMPanelStatic
              values={valuesByDevice[deviceId] ?? {}}
              connections={connections}
            />
          </div>
        ))}

        {/* Knob table — grouped by device, then section */}
        {deviceList.map(deviceId => {
          const devValues = valuesByDevice[deviceId] ?? {}
          return (
            <div key={deviceId} className="max-w-3xl mx-auto px-6">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-4">
                {deviceId} — Knob Settings
              </div>
              <div className="space-y-6">
                {sections.map(section => {
                  const sectionKnobs = DFAM_KNOBS.filter(k => k.section === section && devValues[k.id] !== undefined)
                  if (sectionKnobs.length === 0) return null
                  return (
                    <div key={section}>
                      <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
                        {SECTION_LABELS[section]}
                      </div>
                      <table className="w-full text-xs font-mono">
                        <tbody>
                          {sectionKnobs.map(knob => (
                            <tr key={knob.id} className="border-b border-zinc-900">
                              <td className="py-1.5 text-zinc-500">{knob.label}</td>
                              <td className="py-1.5 text-right text-orange-400 font-bold">
                                {knob.type === 'switch'
                                  ? (knob.options?.[devValues[knob.id]] ?? devValues[knob.id])
                                  : devValues[knob.id].toFixed(1)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Notes */}
        {patch.sequenceNotes && (
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">Notes</div>
            <p className="text-sm font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">{patch.sequenceNotes}</p>
          </div>
        )}

        {/* Audio */}
        {patch.audioUrl && (
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest pb-1 border-b border-zinc-800 mb-3">
              Audio
            </div>
            <AudioPlayer
              src={patch.audioUrl}
              filename={patch.audioUrl.split('/').pop()}
            />
          </div>
        )}

        {/* Copy banner */}
        {patch.isPublic && session?.user?.id !== patch.userId && (
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex items-center justify-between bg-[#111] border border-zinc-800 rounded px-4 py-3">
              <span className="text-xs font-mono text-zinc-500">Save this patch to your library</span>
              <CopyButton
                patchId={patch.id}
                label="Copy to my library"
                className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-500 transition-colors"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
