/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/patches/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    patch: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))
import { auth as mockAuth } from '@/auth'

const mockPatch = {
  id: 'cltest123',
  name: 'Test Patch',
  device: 'DFAM',
  description: null,
  tags: ['test'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  _count: { connections: 2 },
}

describe('GET /api/patches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1', email: 'test@test.com' } })
  })

  it('returns list of patches as JSON', async () => {
    ;(prisma.patch.findMany as jest.Mock).mockResolvedValue([mockPatch])
    const req = new NextRequest('http://localhost/api/patches')
    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].name).toBe('Test Patch')
  })

  it('passes search param to prisma where clause', async () => {
    ;(prisma.patch.findMany as jest.Mock).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/patches?search=kick')
    await GET(req)
    const call = (prisma.patch.findMany as jest.Mock).mock.calls[0][0]
    expect(JSON.stringify(call.where)).toContain('kick')
  })

  it('passes tags param to prisma where clause', async () => {
    ;(prisma.patch.findMany as jest.Mock).mockResolvedValue([])
    const req = new NextRequest('http://localhost/api/patches?tags=bass,acid')
    await GET(req)
    const call = (prisma.patch.findMany as jest.Mock).mock.calls[0][0]
    expect(JSON.stringify(call.where)).toContain('bass')
  })

  it('returns 401 when no session', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

describe('POST /api/patches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1', email: 'test@test.com' } })
  })

  it('creates a patch and returns 201', async () => {
    ;(prisma.patch.create as jest.Mock).mockResolvedValue({ ...mockPatch, _count: undefined })
    const body = {
      name: 'New Patch',
      device: 'DFAM',
      tags: ['bass'],
      knobSettings: [{ knobId: 'tempo', value: 7 }],
      connections: [{ fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }],
      description: '',
      sequenceNotes: '',
      audioUrl: '',
    }
    const req = new NextRequest('http://localhost/api/patches', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/patches', {
      method: 'POST',
      body: JSON.stringify({ device: 'DFAM' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when no session', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
