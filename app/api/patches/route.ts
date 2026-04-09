import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const tagsParam = searchParams.get('tags') || ''
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []

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
        tags.length > 0 ? { tags: { hasSome: tags } } : {},
      ],
    },
    include: { _count: { select: { connections: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(patches)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { name, device, description, tags, knobSettings, connections, sequenceNotes, audioUrl, photoUrl } = body

  const patch = await prisma.patch.create({
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

  return NextResponse.json(patch, { status: 201 })
}
