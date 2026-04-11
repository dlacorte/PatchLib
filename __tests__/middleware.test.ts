/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { middleware, config } from '@/middleware'

describe('middleware', () => {
  it('redirects to /login when no session cookie is present', () => {
    const req = new NextRequest('http://localhost/library')
    const res = middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('allows request through when session cookie is present', () => {
    const req = new NextRequest('http://localhost/library', {
      headers: { cookie: 'authjs.session-token=abc123' },
    })
    const res = middleware(req)
    expect(res.status).toBe(200)
  })

  it('exports a config matcher for /library paths', () => {
    expect(config.matcher).toContain('/library/:path*')
  })
})
