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
  },
}))

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
  knobSettings: [],
  connections: [],
}

describe('GET /api/patches/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

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
})

describe('PUT /api/patches/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

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
})

describe('DELETE /api/patches/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deletes patch and returns 204', async () => {
    ;(prisma.patch.delete as jest.Mock).mockResolvedValue({})
    const req = new NextRequest('http://localhost/api/patches/cltest123', { method: 'DELETE' })
    const res = await DELETE(req, params)
    expect(res.status).toBe(204)
  })
})
