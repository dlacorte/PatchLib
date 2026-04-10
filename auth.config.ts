import type { NextAuthConfig } from 'next-auth'

// Lightweight config used by middleware (Edge-compatible — no Prisma, no SES).
// Full config with PrismaAdapter + SES is in auth.ts.
export const authConfig: NextAuthConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLibrary = nextUrl.pathname.startsWith('/library')
      if (isLibrary) return isLoggedIn
      return true
    },
  },
  providers: [],
}
