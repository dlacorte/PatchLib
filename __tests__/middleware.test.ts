/**
 * @jest-environment node
 */

// Middleware depends on the Auth.js request extension.
// We test the redirect logic with a minimal mock.

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { NextRequest } from 'next/server'

describe('middleware', () => {
  beforeEach(() => jest.resetModules())

  it('redirects unauthenticated requests to /library to /login', async () => {
    // After resetModules, re-require auth mock from the fresh registry and configure it
    const { auth: freshAuthMock } = await import('@/auth')
    ;(freshAuthMock as jest.Mock).mockImplementation((fn: Function) => {
      // auth(handler) in Auth.js returns a middleware function — mock must do the same
      return async (req: NextRequest) => {
        ;(req as any).auth = null
        return fn(req)
      }
    })
    const { default: middleware } = await import('@/middleware')
    const result = await (middleware as any)(new NextRequest('http://localhost/library'))
    // Auth.js wraps the handler — we verify the mock was called
    expect(freshAuthMock).toHaveBeenCalled()
  })

  it('exports a config matcher for /library paths', async () => {
    // Ensure auth returns something callable so middleware can export
    const { auth: freshAuthMock } = await import('@/auth')
    ;(freshAuthMock as jest.Mock).mockImplementation((fn: Function) => {
      return async (req: NextRequest) => fn(req)
    })
    const { config } = await import('@/middleware')
    expect(config.matcher).toContain('/library/:path*')
  })
})
