import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import type { Device } from '@/lib/types'
import { SUPPORTED_DEVICES } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const tagsParam = searchParams.get('tags') || ''
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []

  const patches = await prisma.patch.findMany({
    where: {
      userId: session.user.id,
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
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const {
    name, devices, description, tags,
    knobSettings, connections, sequenceNotes, audioUrl, photoUrl, isPublic,
  } = body

  if (devices && !Array.isArray(devices)) {
    return NextResponse.json({ error: 'devices must be an array' }, { status: 400 })
  }
  if (devices && !devices.every((d: unknown) => SUPPORTED_DEVICES.includes(d as Device))) {
    return NextResponse.json({ error: 'Invalid device' }, { status: 400 })
  }

  const patch = await prisma.patch.create({
    data: {
      name,
      devices: devices?.length ? devices : ['DFAM'],
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      isPublic: isPublic ?? false,
      userId: session.user.id,
      knobSettings: {
        create: (knobSettings || []).map((k: { device: string; knobId: string; value: number }) => ({
          device: k.device || 'DFAM',
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
