/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from '@/app/api/patches/[id]/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    patch: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    knobSetting: { deleteMany: jest.fn() },
    cableConnection: { deleteMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
      fn({
        knobSetting: { deleteMany: jest.fn() },
        cableConnection: { deleteMany: jest.fn() },
        patch: { update: jest.fn().mockResolvedValue({
          id: 'cltest123', name: 'Updated', devices: ['DFAM'], description: null,
          tags: [], sequenceNotes: null, audioUrl: null, photoUrl: null,
          isPublic: false, userId: 'u1', createdAt: new Date(), updatedAt: new Date(),
          knobSettings: [], connections: [],
        }) },
      })
    ),
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))
import { auth as mockAuth } from '@/auth'

const params = { params: { id: 'cltest123' } }

const fullPatch = {
  id: 'cltest123',
  name: 'Test',
  device: 'DFAM',
  description: null,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  isPublic: false,
  userId: 'u1',
  knobSettings: [],
  connections: [],
}

describe('GET /api/patches/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
  })

  it('returns patch when found', async () => {
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
    const req = new NextRequest('http://localhost/api/patches/cltest123')
    const res = await GET(req, params)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('cltest123')
  })

  it('returns 404 when not found', async () => {
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches/missing')
    const res = await GET(req, { params: { id: 'missing' } })
    expect(res.status).toBe(404)
  })

  it('returns 404 for private patch viewed by non-owner', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'other' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
    const req = new NextRequest('http://localhost/api/patches/cltest123')
    const res = await GET(req, params)
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/patches/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
  })

  it('replaces patch and returns updated', async () => {
    ;(prisma.knobSetting.deleteMany as jest.Mock).mockResolvedValue({})
    ;(prisma.cableConnection.deleteMany as jest.Mock).mockResolvedValue({})
    ;(prisma.patch.update as jest.Mock).mockResolvedValue(fullPatch)
    const req = new NextRequest('http://localhost/api/patches/cltest123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated', tags: [], knobSettings: [], connections: [] }),
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(200)
  })

  it('returns 400 when name is missing', async () => {
    const req = new NextRequest('http://localhost/api/patches/cltest123', {
      method: 'PUT',
      body: JSON.stringify({ device: 'DFAM' }),
    })
    const res = await PUT(req, params)
    expect(res.status).toBe(400)
  })

  it('returns 401 when no session', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/patches/cltest123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PUT(req, { params: { id: 'cltest123' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user does not own the patch', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'other-user' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue({ ...fullPatch, userId: 'u1' })
    const req = new NextRequest('http://localhost/api/patches/cltest123', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PUT(req, { params: { id: 'cltest123' } })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/patches/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
  })

  it('deletes patch and returns 204', async () => {
    ;(prisma.patch.delete as jest.Mock).mockResolvedValue({})
    const req = new NextRequest('http://localhost/api/patches/cltest123', { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(204)
  })

  it('returns 403 when user does not own the patch', async () => {
    ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'other-user' } })
    ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue({ ...fullPatch, userId: 'u1' })
    const res = await DELETE(new NextRequest('http://localhost/api/patches/cltest123'), { params: { id: 'cltest123' } })
    expect(res.status).toBe(403)
  })
})
