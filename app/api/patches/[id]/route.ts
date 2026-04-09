import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const patch = await prisma.patch.findUnique({
    where: { id: params.id },
    include: { knobSettings: true, connections: true },
  })
  if (!patch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(patch)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { name, device, description, tags, knobSettings, connections, sequenceNotes, audioUrl, photoUrl } = body

  await prisma.knobSetting.deleteMany({ where: { patchId: params.id } })
  await prisma.cableConnection.deleteMany({ where: { patchId: params.id } })

  const patch = await prisma.patch.update({
    where: { id: params.id },
    data: {
      name,
      device: device || 'DFAM',
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      knobSettings: {
        create: (knobSettings || []).map((k: { knobId: string; value: number }) => ({
          knobId: k.knobId,
          value: k.value,
        })),
      },
      connections: {
        create: (connections || []).map((c: { fromJack: string; toJack: string; color: string }) => ({
          fromJack: c.fromJack,
          toJack: c.toJack,
          color: c.color,
        })),
      },
    },
    include: { knobSettings: true, connections: true },
  })

  return NextResponse.json(patch)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await prisma.patch.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
