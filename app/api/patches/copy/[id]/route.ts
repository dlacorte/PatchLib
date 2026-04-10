import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Params = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const source = await prisma.patch.findUnique({
    where: { id: params.id, isPublic: true },
    include: { knobSettings: true, connections: true },
  })
  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const copy = await prisma.patch.create({
    data: {
      name: source.name,
      device: source.device,
      description: source.description,
      tags: source.tags,
      sequenceNotes: source.sequenceNotes,
      audioUrl: source.audioUrl,
      isPublic: false,
      userId: session.user.id,
      knobSettings: {
        create: source.knobSettings.map(k => ({ knobId: k.knobId, value: k.value })),
      },
      connections: {
        create: source.connections.map(c => ({
          fromJack: c.fromJack,
          toJack: c.toJack,
          color: c.color,
        })),
      },
    },
  })

  return NextResponse.json(copy, { status: 201 })
}
