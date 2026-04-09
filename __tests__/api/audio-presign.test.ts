/**
 * @jest-environment node
 */
import { POST } from '@/app/api/audio/presign/route'
import { NextRequest } from 'next/server'

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}))

describe('POST /api/audio/presign', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns uploadUrl and publicUrl for valid MP3 request', async () => {
    const req = new NextRequest('http://localhost/api/audio/presign', {
      method: 'POST',
      body: JSON.stringify({ filename: 'test.mp3', contentType: 'audio/mpeg' }),
    })
    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.uploadUrl).toBe('https://s3.example.com/presigned-url')
    expect(data.publicUrl).toMatch(/patchlib-audio/)
    expect(data.publicUrl).toMatch(/\.mp3$/)
  })

  it('returns 400 for non-MP3 content type', async () => {
    const req = new NextRequest('http://localhost/api/audio/presign', {
      method: 'POST',
      body: JSON.stringify({ filename: 'track.wav', contentType: 'audio/wav' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is missing', async () => {
    const req = new NextRequest('http://localhost/api/audio/presign', {
      method: 'POST',
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
