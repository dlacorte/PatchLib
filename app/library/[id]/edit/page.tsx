import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { EditPatchClient } from './EditPatchClient'
import type { PatchFormValues } from '@/lib/types'

interface PageProps {
  params: { id: string }
}

export default async function EditPatchPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const patch = await prisma.patch.findUnique({
    where: { id: params.id },
    include: { knobSettings: true, connections: true },
  })

  if (!patch) notFound()
  if (patch.userId !== session.user.id) redirect('/library')

  const defaultValues: PatchFormValues = {
    name: patch.name,
    description: patch.description ?? '',
    tags: patch.tags,
    knobSettings: Object.fromEntries(patch.knobSettings.map(k => [k.knobId, k.value])),
    connections: patch.connections.map(c => ({
      fromJack: c.fromJack,
      toJack: c.toJack,
      color: c.color,
    })),
    sequenceNotes: patch.sequenceNotes ?? '',
    audioUrl: patch.audioUrl ?? '',
    isPublic: patch.isPublic,
  }

  return <EditPatchClient patchId={patch.id} defaultValues={defaultValues} />
}
