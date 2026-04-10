/**
 * @jest-environment node
 */
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    patch: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { POST } from '@/app/api/patches/copy/[id]/route'
import { auth as mockAuth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

const sourcePatch = {
  id: 'src123',
  name: 'Heavy Kick',
  device: 'DFAM',
  description: null,
  tags: ['kick'],
  isPublic: true,
  userId: 'original-user',
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  knobSettings: [{ knobId: 'tempo', value: 7.2 }],
  connections: [{ fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }],
}

describe('POST /api/patches/copy/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when no session', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches/copy/src123', { method: 'POST' })
    const res = await POST(req, { params: { id: 'src123' } })
    expect(res.status).toBe(401)
  })

  it('returns 404 when source patch not found or private', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches/copy/src123', { method: 'POST' })
    const res = await POST(req, { params: { id: 'src123' } })
    expect(res.status).toBe(404)
  })

  it('creates a copy with correct userId and isPublic: false', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u2' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(sourcePatch)
    ;(prisma.patch.create as jest.Mock).mockResolvedValue({ ...sourcePatch, id: 'copy123', userId: 'u2', isPublic: false })

    const req = new NextRequest('http://localhost/api/patches/copy/src123', { method: 'POST' })
    const res = await POST(req, { params: { id: 'src123' } })
    expect(res.status).toBe(201)

    const createCall = (prisma.patch.create as jest.Mock).mock.calls[0][0]
    expect(createCall.data.userId).toBe('u2')
    expect(createCall.data.isPublic).toBe(false)
    expect(createCall.data.name).toBe('Heavy Kick')
  })
})
