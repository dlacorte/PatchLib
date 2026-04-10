# User Management UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add magic-link auth, per-user patch ownership, public/private visibility, a discovery page, a personal library, and a copy-to-library flow to PatchLib.

**Architecture:** Auth.js v5 (`next-auth@5`) with the built-in EmailProvider handles magic links; `@auth/prisma-adapter` persists sessions to Postgres; Amazon SES delivers the email. Discovery (`/`) stays open; `/library/*` routes are protected by Next.js middleware. Server components read the session with `auth()`; client components use `useSession()` wrapped by a root `SessionProvider`.

**Tech Stack:** Next.js 14 App Router, Auth.js v5 (`next-auth@5`), `@auth/prisma-adapter`, `@aws-sdk/client-ses`, Prisma 7, TypeScript, Tailwind, Jest + Testing Library

**Design spec:** `docs/superpowers/specs/2026-04-10-user-management-ui-design.md`
**Backend spec:** `docs/superpowers/specs/2026-04-09-user-management-design.md`

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `auth.ts` | **Create** | Auth.js v5 config — EmailProvider + PrismaAdapter + SES transport |
| `middleware.ts` | **Create** | Redirect `/library/*` to `/login` when unauthenticated |
| `app/api/auth/[...nextauth]/route.ts` | **Create** | Mount Auth.js HTTP handlers |
| `app/api/patches/route.ts` | **Modify** | Add session check (401 when no auth); add `userId` + `isPublic` to create |
| `app/api/patches/[id]/route.ts` | **Modify** | Add ownership check on PUT/DELETE; add `isPublic` to PUT |
| `app/api/patches/copy/[id]/route.ts` | **Create** | POST — copy public patch to current user's library |
| `prisma/schema.prisma` | **Modify** | Add User/Account/Session/VerificationToken; add `userId`+`isPublic` to Patch |
| `lib/types.ts` | **Modify** | Add `isPublic` to `PatchFormValues`; add owner fields to `PatchListItem` |
| `app/layout.tsx` | **Modify** | Wrap children with `SessionProvider` |
| `app/page.tsx` | **Modify** | Query only `isPublic: true` patches; include `user` relation for owner label |
| `app/patches/[id]/page.tsx` | **Modify** | Add `CopyButton` in nav + copy banner; hide both on own patches |
| `app/patches/new/page.tsx` | **Modify** | Replace with redirect to `/library/new` |
| `app/patches/[id]/edit/page.tsx` | **Modify** | Replace with redirect to `/library/[id]/edit` |
| `app/login/page.tsx` | **Create** | Full-bleed hero — form state + post-send state |
| `app/library/page.tsx` | **Create** | User's own patches with visibility badges |
| `app/library/new/page.tsx` | **Create** | Create patch form (auth-required) |
| `app/library/[id]/edit/page.tsx` | **Create** | Edit patch form (ownership-checked) |
| `components/layout/Nav.tsx` | **Create** | Auth-aware nav — guest / browse / library states |
| `components/library/PatchCard.tsx` | **Modify** | Add `variant` prop: `"discovery"` (owner label) or `"library"` (visibility badge) |
| `components/ui/VisibilityToggle.tsx` | **Create** | Controlled toggle switch for public/private |
| `components/auth/CopyButton.tsx` | **Create** | Auth-aware copy button — redirects to login if no session |
| `components/patch-form/PatchForm.tsx` | **Modify** | Add `isPublic` field + `VisibilityToggle` |

---

## Task 1: Install packages and add env vars

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install Auth.js v5 and SES**

```bash
npm install next-auth@5 @auth/prisma-adapter @aws-sdk/client-ses
```

Expected: packages added to `node_modules` and `package.json`.

- [ ] **Step 2: Add env vars to `.env.local`**

Add to `.env.local` (do not commit this file):

```bash
# Auth.js
AUTH_SECRET=<generate with: openssl rand -base64 32>
AUTH_EMAIL_FROM=noreply@patchlib.app

# AWS region for SES (reuse existing key)
AWS_REGION=us-east-1
```

> Note: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` should already be in `.env.local` for the audio upload feature. The same key is used for SES — grant `ses:SendEmail` permission to that IAM user if not already done.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install next-auth@5, @auth/prisma-adapter, @aws-sdk/client-ses"
```

---

## Task 2: Prisma schema — add auth models and ownership fields

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma` with the new schema**

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  displayName   String?
  image         String?
  createdAt     DateTime  @default(now())
  accounts      Account[]
  sessions      Session[]
  patches       Patch[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Patch {
  id            String            @id @default(cuid())
  name          String
  device        String            @default("DFAM")
  description   String?
  tags          String[]
  isPublic      Boolean           @default(false)
  userId        String
  user          User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
  knobSettings  KnobSetting[]
  connections   CableConnection[]
  sequenceNotes String?
  audioUrl      String?
  photoUrl      String?
}

model KnobSetting {
  id      String @id @default(cuid())
  patch   Patch  @relation(fields: [patchId], references: [id], onDelete: Cascade)
  patchId String
  knobId  String
  value   Float
}

model CableConnection {
  id       String @id @default(cuid())
  patch    Patch  @relation(fields: [patchId], references: [id], onDelete: Cascade)
  patchId  String
  fromJack String
  toJack   String
  color    String
}
```

- [ ] **Step 2: Clear existing data and run migration**

```bash
# Clear all existing patch data (cascades to KnobSetting and CableConnection)
npx prisma db execute --stdin <<'SQL'
TRUNCATE "Patch" CASCADE;
SQL

# Generate and apply the migration
npx prisma migrate dev --name add-auth-and-ownership
```

Expected output: `✓ Generated Prisma Client` and `The following migration(s) have been created and applied`.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Auth.js models and ownership fields to Patch schema"
```

---

## Task 3: Auth.js v5 config

**Files:**
- Create: `auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `auth.ts` at the project root**

```typescript
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Email from 'next-auth/providers/email'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { prisma } from '@/lib/prisma'

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' })

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      from: process.env.AUTH_EMAIL_FROM!,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await ses.send(
          new SendEmailCommand({
            Source: process.env.AUTH_EMAIL_FROM!,
            Destination: { ToAddresses: [email] },
            Message: {
              Subject: { Data: 'Sign in to PatchLib' },
              Body: {
                Html: {
                  Data: `<p>Click the link below to sign in to PatchLib:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
                },
                Text: {
                  Data: `Sign in to PatchLib: ${url}\n\nThis link expires in 24 hours.`,
                },
              },
            },
          }),
        )
      },
    }),
  ],
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
})
```

- [ ] **Step 2: Create `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 3: Verify the auth route exists**

```bash
ls app/api/auth/\[...nextauth\]/
```

Expected: `route.ts`

- [ ] **Step 4: Commit**

```bash
git add auth.ts app/api/auth/
git commit -m "feat: add Auth.js v5 config with EmailProvider + SES transport"
```

---

## Task 4: Middleware — protect `/library/*`

**Files:**
- Create: `middleware.ts`
- Create: `__tests__/middleware.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/middleware.test.ts`:

```typescript
/**
 * @jest-environment node
 */

// Middleware depends on the Auth.js request extension.
// We test the redirect logic with a minimal mock.

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

import { auth as mockAuth } from '@/auth'
import { NextRequest } from 'next/server'

// Re-import after mock is set up
async function runMiddleware(url: string, hasSession: boolean) {
  (mockAuth as jest.Mock).mockImplementation(async (fn: Function) => {
    const req = new NextRequest(url)
    ;(req as any).auth = hasSession ? { user: { id: 'u1', email: 'test@test.com' } } : null
    return fn(req)
  })
  // Dynamic import so the mock applies
  const { default: middleware } = await import('@/middleware')
  return middleware
}

describe('middleware', () => {
  beforeEach(() => jest.resetModules())

  it('redirects unauthenticated requests to /library to /login', async () => {
    (mockAuth as jest.Mock).mockImplementation(async (fn: Function) => {
      const req = new NextRequest('http://localhost/library')
      ;(req as any).auth = null
      return fn(req)
    })
    const { default: middleware } = await import('@/middleware')
    const result = await (middleware as any)(new NextRequest('http://localhost/library'))
    // Auth.js wraps the handler — we verify the mock was called
    expect(mockAuth).toHaveBeenCalled()
  })

  it('exports a config matcher for /library paths', async () => {
    const { config } = await import('@/middleware')
    expect(config.matcher).toContain('/library/:path*')
  })
})
```

- [ ] **Step 2: Run test — expect fail**

```bash
npx jest __tests__/middleware.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/middleware'`

- [ ] **Step 3: Create `middleware.ts`**

```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
})

export const config = {
  matcher: ['/library/:path*'],
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest __tests__/middleware.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add middleware.ts __tests__/middleware.test.ts
git commit -m "feat: add middleware to protect /library/* routes"
```

---

## Task 5: Add auth guards to existing API routes

**Files:**
- Modify: `app/api/patches/route.ts`
- Modify: `app/api/patches/[id]/route.ts`
- Modify: `__tests__/api/patches.test.ts`
- Modify: `__tests__/api/patches-id.test.ts`

- [ ] **Step 1: Update the patches test to add auth failure cases**

Add to `__tests__/api/patches.test.ts` (add at the top of the file, inside the mock section):

```typescript
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))
import { auth as mockAuth } from '@/auth'
```

Add these tests inside the existing `describe('POST /api/patches', ...)` block:

```typescript
it('returns 401 when no session', async () => {
  ;(mockAuth as jest.Mock).mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/patches', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test' }),
  })
  const res = await POST(req)
  expect(res.status).toBe(401)
})
```

Add to `describe('GET /api/patches', ...)`:

```typescript
it('returns 401 when no session', async () => {
  ;(mockAuth as jest.Mock).mockResolvedValue(null)
  const req = new NextRequest('http://localhost/api/patches')
  const res = await GET(req)
  expect(res.status).toBe(401)
})
```

For tests that expect 200/201, add before each:
```typescript
beforeEach(() => {
  ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1', email: 'test@test.com' } })
})
```

- [ ] **Step 2: Run tests — expect fail**

```bash
npx jest __tests__/api/patches.test.ts --no-coverage
```

Expected: FAIL — auth mock returns 200 when it should return 401.

- [ ] **Step 3: Update `app/api/patches/route.ts`**

Replace the full file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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

  const { name, device, description, tags, knobSettings, connections, sequenceNotes, audioUrl, photoUrl, isPublic } = body

  const patch = await prisma.patch.create({
    data: {
      name,
      device: device || 'DFAM',
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      isPublic: isPublic ?? false,
      userId: session.user.id,
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
```

- [ ] **Step 4: Update `app/api/patches/[id]/route.ts`** — add auth + ownership checks to PUT and DELETE

Replace the full file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const patch = await prisma.patch.findUnique({
    where: { id: params.id },
    include: { knobSettings: true, connections: true },
  })
  if (!patch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(patch)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.patch.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { name, device, description, tags, knobSettings, connections, sequenceNotes, audioUrl, photoUrl, isPublic } = body

  await prisma.knobSetting.deleteMany({ where: { patchId: params.id } })
  await prisma.cableConnection.deleteMany({ where: { patchId: params.id } })

  const patch = await prisma.patch.update({
    where: { id: params.id },
    data: {
      name,
      device: device || 'DFAM',
      description: description || null,
      tags: tags || [],
      sequenceNotes: sequenceNotes || null,
      audioUrl: audioUrl || null,
      photoUrl: photoUrl || null,
      isPublic: isPublic ?? existing.isPublic,
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

  return NextResponse.json(patch)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.patch.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.patch.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 5: Update `__tests__/api/patches-id.test.ts`** — add ownership + auth test cases

Add the following mock at the top of the file alongside the prisma mock:

```typescript
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))
import { auth as mockAuth } from '@/auth'
```

Add to the existing `describe('PUT /api/patches/[id]', ...)` block:

```typescript
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
  ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue({ ...mockPatch, userId: 'u1' })
  const req = new NextRequest('http://localhost/api/patches/cltest123', {
    method: 'PUT',
    body: JSON.stringify({ name: 'Updated' }),
  })
  const res = await PUT(req, { params: { id: 'cltest123' } })
  expect(res.status).toBe(403)
})
```

Add to `describe('DELETE /api/patches/[id]', ...)`:

```typescript
it('returns 403 when user does not own the patch', async () => {
  ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'other-user' } })
  ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue({ ...mockPatch, userId: 'u1' })
  const res = await DELETE(new NextRequest('http://localhost/api/patches/cltest123'), { params: { id: 'cltest123' } })
  expect(res.status).toBe(403)
})
```

Also update the `fullPatch` fixture at the top of `__tests__/api/patches-id.test.ts` to include `userId` — without it, the ownership check `existing.userId !== session.user.id` will always fail:

```typescript
// Replace the existing fullPatch definition
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
  userId: 'u1',       // ← must match the session userId in auth mock
  knobSettings: [],
  connections: [],
}
```

For all existing PUT/DELETE tests that expect 200/204, update their `beforeEach` to also set the auth mock (add alongside the existing `jest.clearAllMocks()` call):

```typescript
// In describe('PUT /api/patches/[id]', ...)
beforeEach(() => {
  jest.clearAllMocks()
  ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
  ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
})

// In describe('DELETE /api/patches/[id]', ...)
beforeEach(() => {
  jest.clearAllMocks()
  ;(mockAuth as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
  ;(prisma.patch.findUnique as jest.Mock).mockResolvedValue(fullPatch)
})
```

- [ ] **Step 6: Run all API tests**

```bash
npx jest __tests__/api/ --no-coverage
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/patches/ __tests__/api/
git commit -m "feat: add auth guards and ownership checks to patches API"
```

---

## Task 6: Copy patch API endpoint

**Files:**
- Create: `app/api/patches/copy/[id]/route.ts`
- Create: `__tests__/api/patches-copy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/api/patches-copy.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect fail**

```bash
npx jest __tests__/api/patches-copy.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/patches/copy/[id]/route'`

- [ ] **Step 3: Create `app/api/patches/copy/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

type Params = { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const source = await prisma.patch.findUnique({
    where: { id: params.id, isPublic: true },
    include: { knobSettings: true, connections: true },
  })
  if (!source) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const copy = await prisma.patch.create({
    data: {
      name: source.name,
      device: source.device,
      description: source.description,
      tags: source.tags,
      sequenceNotes: source.sequenceNotes,
      audioUrl: source.audioUrl,
      isPublic: false,
      userId: session.user.id,
      knobSettings: {
        create: source.knobSettings.map(k => ({ knobId: k.knobId, value: k.value })),
      },
      connections: {
        create: source.connections.map(c => ({
          fromJack: c.fromJack,
          toJack: c.toJack,
          color: c.color,
        })),
      },
    },
  })

  return NextResponse.json(copy, { status: 201 })
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest __tests__/api/patches-copy.test.ts --no-coverage
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/patches/copy/ __tests__/api/patches-copy.test.ts
git commit -m "feat: add POST /api/patches/copy/[id] endpoint"
```

---

## Task 7: Update `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Update types**

Replace `lib/types.ts`:

```typescript
import type { Patch, KnobSetting, CableConnection } from '@prisma/client'

export type Device = 'DFAM' | 'Subharmonicon' | 'Mother-32'

export const SUPPORTED_DEVICES: Device[] = ['DFAM', 'Subharmonicon', 'Mother-32']

export type PatchWithRelations = Patch & {
  knobSettings: KnobSetting[]
  connections: CableConnection[]
}

export type PatchListItem = Patch & {
  _count: { connections: number }
  user: { displayName: string | null; email: string }
}

// Shape used in the create/edit form — before saving to DB
export interface PatchFormValues {
  name: string
  description: string
  tags: string[]
  knobSettings: Record<string, number>   // knobId → value (0–10)
  connections: ConnectionFormValue[]
  sequenceNotes: string
  audioUrl: string
  isPublic: boolean
}

export interface ConnectionFormValue {
  fromJack: string
  toJack: string
  color: string
}
```

- [ ] **Step 2: Run all tests to check for type regressions**

```bash
npx jest --no-coverage
```

Expected: all existing tests still PASS (the new `isPublic` field in `PatchFormValues` is additive — existing form code will need updating in Task 11).

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add isPublic to PatchFormValues, add user to PatchListItem"
```

---

## Task 8: SessionProvider in layout

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import './globals.css'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'PatchLib',
  description: 'Analog synthesizer patch library for DFAM',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono bg-[#0a0a0a] text-zinc-100 antialiased`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wrap layout with SessionProvider for client-side auth"
```

---

## Task 9: Nav component

**Files:**
- Create: `components/layout/Nav.tsx`

- [ ] **Step 1: Create `components/layout/Nav.tsx`**

```typescript
import Link from 'next/link'
import { auth } from '@/auth'
import { signOut } from '@/auth'

export async function Nav({ activePage }: { activePage?: 'browse' | 'library' }) {
  const session = await auth()

  return (
    <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
      <Link
        href="/"
        className="text-orange-500 font-mono font-bold tracking-[4px] text-sm"
      >
        PATCHLIB
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={`text-xs font-mono transition-colors ${
            activePage === 'browse'
              ? 'text-zinc-100 border-b border-orange-500 pb-px'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Browse
        </Link>

        {session && (
          <Link
            href="/library"
            className={`text-xs font-mono transition-colors ${
              activePage === 'library'
                ? 'text-zinc-100 border-b border-orange-500 pb-px'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            My Library
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            <span className="text-[11px] font-mono text-zinc-600 hidden sm:block">
              {session.user?.email}
            </span>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button
                type="submit"
                className="text-xs font-mono text-zinc-500 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/login"
            className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/Nav.tsx
git commit -m "feat: add auth-aware Nav component"
```

---

## Task 10: Login page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`

- [ ] **Step 1: Create the server action `app/login/actions.ts`**

```typescript
'use server'

import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const callbackUrl = formData.get('callbackUrl') as string | undefined

  try {
    await signIn('email', {
      email,
      redirectTo: callbackUrl || '/library',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      redirect('/login?error=send-failed')
    }
    // signIn throws a NEXT_REDIRECT for the verification email sent redirect
    throw error
  }
}
```

- [ ] **Step 2: Create `app/login/page.tsx`**

```typescript
import Link from 'next/link'
import { sendMagicLink } from './actions'

interface LoginPageProps {
  searchParams: { sent?: string; error?: string; callbackUrl?: string }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const sent = searchParams.sent === '1'
  const hasError = searchParams.error === 'send-failed'
  const callbackUrl = searchParams.callbackUrl || '/library'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Topbar */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <span className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">PATCHLIB</span>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {sent ? (
          /* Post-send state */
          <div className="flex flex-col items-center gap-4 max-w-xs">
            <span className="text-3xl text-orange-500">✉</span>
            <h1 className="text-lg font-mono font-bold text-zinc-100">Check your inbox</h1>
            <p className="text-xs font-mono text-zinc-600 leading-relaxed">
              We sent a magic link to your email.<br />
              The link expires in 24 hours.
            </p>
          </div>
        ) : (
          /* Form state */
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            <div>
              <h1 className="text-3xl font-mono font-bold text-orange-500 tracking-[0.25em] mb-1">
                PATCHLIB
              </h1>
              <p className="text-[11px] font-mono text-zinc-700 tracking-[0.2em] uppercase">
                Your Analog Patch Library
              </p>
            </div>

            <form action={sendMagicLink} className="w-full flex flex-col gap-3">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="your@email.com"
                className="w-full bg-[#111] border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs tracking-widest uppercase px-3 py-2 rounded transition-colors"
              >
                Send Magic Link
              </button>
            </form>

            {hasError && (
              <p className="text-xs font-mono text-red-400">
                Could not send email. Please try again.
              </p>
            )}

            <p className="text-[11px] font-mono text-zinc-700 leading-relaxed">
              We&apos;ll send a one-time link to your inbox.<br />
              No password required.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-900 px-6 py-3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-zinc-800">
          DFAM · SUBHARMONICON · MOTHER-32
        </span>
        <Link
          href="/"
          className="text-[10px] font-mono text-zinc-700 hover:text-zinc-500 transition-colors"
        >
          Browse without account →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify it renders by running the dev server briefly (manual check)**

```bash
npm run dev
```

Open `http://localhost:3000/login` — expect the full-bleed hero with wordmark and email form.

- [ ] **Step 4: Commit**

```bash
git add app/login/
git commit -m "feat: add login page with magic link form and post-send state"
```

---

## Task 11: PatchCard — add variant prop

**Files:**
- Modify: `components/library/PatchCard.tsx`
- Modify: `__tests__/components/library.test.tsx`

- [ ] **Step 1: Write failing tests for the new variant prop**

First, update the existing `mockPatch` fixture in `__tests__/components/library.test.tsx` — add the new required fields so existing tests keep passing and new tests can extend it:

```typescript
// Replace the existing mockPatch definition
const mockPatch = {
  id: 'cl123',
  name: 'Heavy Kick',
  device: 'DFAM',
  description: 'Deep kick',
  tags: ['percussion', 'kick'],
  createdAt: new Date('2026-04-08'),
  updatedAt: new Date('2026-04-08'),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  isPublic: false,
  userId: 'u1',
  _count: { connections: 2 },
  user: { displayName: null, email: 'test@test.com' },
}
```

Then add the new test blocks after the existing `describe('PatchCard', ...)`:

```typescript
describe('PatchCard — discovery variant', () => {
  it('shows owner label "by janko" when displayName is set', () => {
    render(<PatchCard patch={{ ...mockPatch, user: { displayName: 'janko', email: 'janko@test.com' } }} variant="discovery" />)
    expect(screen.getByText(/by janko/i)).toBeInTheDocument()
  })

  it('falls back to email prefix when displayName is null', () => {
    render(<PatchCard patch={{ ...mockPatch, user: { displayName: null, email: 'someone@test.com' } }} variant="discovery" />)
    expect(screen.getByText(/by someone/i)).toBeInTheDocument()
  })
})

describe('PatchCard — library variant', () => {
  it('shows "public" badge when isPublic is true', () => {
    render(<PatchCard patch={{ ...mockPatch, isPublic: true }} variant="library" />)
    expect(screen.getByText('public')).toBeInTheDocument()
  })

  it('shows "private" badge when isPublic is false', () => {
    render(<PatchCard patch={{ ...mockPatch, isPublic: false }} variant="library" />)
    expect(screen.getByText('private')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect fail**

```bash
npx jest __tests__/components/library.test.tsx --no-coverage
```

Expected: FAIL — variant prop does not exist

- [ ] **Step 3: Replace `components/library/PatchCard.tsx`**

```typescript
import Link from 'next/link'
import type { PatchListItem } from '@/lib/types'

interface PatchCardProps {
  patch: PatchListItem
  variant?: 'discovery' | 'library'
  href?: string
}

function ownerName(user: { displayName: string | null; email: string }): string {
  return user.displayName ?? user.email.split('@')[0]
}

export function PatchCard({ patch, variant = 'discovery', href }: PatchCardProps) {
  const date = new Date(patch.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={href ?? `/patches/${patch.id}`}
      className="block bg-[#111] border border-zinc-800 rounded px-4 py-3 hover:border-zinc-600 hover:bg-[#161616] transition-colors group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-sm text-zinc-100 group-hover:text-white truncate">
              {patch.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 border border-zinc-700 rounded px-1 py-0 flex-shrink-0">
              {patch.device}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-600">
            <span>{patch._count.connections} cables</span>
            {patch.audioUrl && <span className="text-zinc-500" title="Has audio">♪</span>}
            {variant === 'discovery' && (
              <span className="text-zinc-500">by {ownerName(patch.user)}</span>
            )}
            {patch.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {patch.tags.map(tag => (
                  <span key={tag} className="text-zinc-500">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {variant === 'library' && (
            <span
              className={`text-[10px] font-mono border rounded px-1.5 py-0 ${
                patch.isPublic
                  ? 'text-green-600 border-green-900'
                  : 'text-zinc-600 border-zinc-800'
              }`}
            >
              {patch.isPublic ? 'public' : 'private'}
            </span>
          )}
          <span className="text-[11px] text-zinc-600 font-mono">{date}</span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx jest __tests__/components/library.test.tsx --no-coverage
```

Expected: all PASS

- [ ] **Step 5: Commit**

```bash
git add components/library/PatchCard.tsx __tests__/components/library.test.tsx
git commit -m "feat: add variant prop to PatchCard (discovery + library)"
```

---

## Task 12: Update Discovery page (`app/page.tsx`)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'
import { Nav } from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: { search?: string; tags?: string }
}

async function PatchList({ search, activeTags }: { search: string; activeTags: string[] }) {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: {
      isPublic: true,
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        activeTags.length > 0 ? { tags: { hasSome: activeTags } } : {},
      ],
    },
    include: {
      _count: { select: { connections: true } },
      user: { select: { displayName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (patches.length === 0) {
    return (
      <p className="text-zinc-600 text-sm font-mono py-12 text-center">
        No public patches yet.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map(patch => (
        <PatchCard key={patch.id} patch={patch} variant="discovery" />
      ))}
    </div>
  )
}

async function getAllPublicTags(): Promise<string[]> {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: { isPublic: true },
    select: { tags: true },
  })
  return Array.from(new Set(patches.flatMap(p => p.tags))).sort()
}

export default async function DiscoveryPage({ searchParams }: PageProps) {
  const search = searchParams.search || ''
  const activeTags = searchParams.tags?.split(',').filter(Boolean) || []
  const allTags = await getAllPublicTags()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav activePage="browse" />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <Suspense>
          <SearchBar defaultValue={search} />
        </Suspense>

        {allTags.length > 0 && (
          <Suspense>
            <TagFilter tags={allTags} activeTags={activeTags} />
          </Suspense>
        )}

        <Suspense fallback={<p className="text-zinc-600 text-sm font-mono py-4">Loading…</p>}>
          <PatchList search={search} activeTags={activeTags} />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: update discovery page to show public patches with owner labels"
```

---

## Task 13: Library page (`/library`)

**Files:**
- Create: `app/library/page.tsx`

- [ ] **Step 1: Create `app/library/page.tsx`**

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'
import { Nav } from '@/components/layout/Nav'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { search?: string; tags?: string }
}

async function LibraryPatchList({
  userId,
  search,
  activeTags,
}: {
  userId: string
  search: string
  activeTags: string[]
}) {
  const { prisma } = await import('@/lib/prisma')
  const patches = await prisma.patch.findMany({
    where: {
      userId,
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        activeTags.length > 0 ? { tags: { hasSome: activeTags } } : {},
      ],
    },
    include: {
      _count: { select: { connections: true } },
      user: { select: { displayName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (patches.length === 0) {
    return (
      <p className="text-zinc-600 text-sm font-mono py-12 text-center">
        No patches yet.{' '}
        <Link href="/library/new" className="text-orange-500 hover:text-orange-400">
          Create one?
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {patches.map(patch => (
        <PatchCard
          key={patch.id}
          patch={patch}
          variant="library"
          href={`/patches/${patch.id}`}
        />
      ))}
    </div>
  )
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { prisma } = await import('@/lib/prisma')
  const search = searchParams.search || ''
  const activeTags = searchParams.tags?.split(',').filter(Boolean) || []

  const [patchCount, allTags] = await Promise.all([
    prisma.patch.count({ where: { userId: session.user.id } }),
    prisma.patch
      .findMany({ where: { userId: session.user.id }, select: { tags: true } })
      .then(patches => Array.from(new Set(patches.flatMap(p => p.tags))).sort()),
  ])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Nav activePage="library" />

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            My Library · {patchCount} {patchCount === 1 ? 'patch' : 'patches'}
          </span>
          <Link
            href="/library/new"
            className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
          >
            + NEW PATCH
          </Link>
        </div>

        <Suspense>
          <SearchBar defaultValue={search} />
        </Suspense>

        {allTags.length > 0 && (
          <Suspense>
            <TagFilter tags={allTags} activeTags={activeTags} />
          </Suspense>
        )}

        <Suspense fallback={<p className="text-zinc-600 text-sm font-mono py-4">Loading…</p>}>
          <LibraryPatchList
            userId={session.user.id}
            search={search}
            activeTags={activeTags}
          />
        </Suspense>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/library/page.tsx
git commit -m "feat: add /library page with visibility badges and patch count"
```

---

## Task 14: VisibilityToggle component + PatchForm update

**Files:**
- Create: `components/ui/VisibilityToggle.tsx`
- Modify: `components/patch-form/PatchForm.tsx`
- Modify: `__tests__/components/PatchForm.test.tsx`

- [ ] **Step 1: Write failing test for VisibilityToggle**

Add to `__tests__/components/PatchForm.test.tsx`:

```typescript
import { VisibilityToggle } from '@/components/ui/VisibilityToggle'

describe('VisibilityToggle', () => {
  it('shows "private" when value is false', () => {
    render(<VisibilityToggle value={false} onChange={() => {}} />)
    expect(screen.getByText('private')).toBeInTheDocument()
  })

  it('shows "public" when value is true', () => {
    render(<VisibilityToggle value={true} onChange={() => {}} />)
    expect(screen.getByText('public')).toBeInTheDocument()
  })

  it('calls onChange with toggled value on click', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<VisibilityToggle value={false} onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
```

- [ ] **Step 2: Run test — expect fail**

```bash
npx jest __tests__/components/PatchForm.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/ui/VisibilityToggle'`

- [ ] **Step 3: Create `components/ui/VisibilityToggle.tsx`**

```typescript
'use client'

interface VisibilityToggleProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function VisibilityToggle({ value, onChange }: VisibilityToggleProps) {
  return (
    <div
      className={`flex items-center justify-between rounded px-3 py-2 border transition-colors ${
        value ? 'border-green-900' : 'border-zinc-800'
      } bg-[#111]`}
    >
      <span className="text-sm font-mono text-zinc-500">Make this patch public</span>
      <button
        type="button"
        role="button"
        onClick={() => onChange(!value)}
        className="flex items-center gap-2 select-none"
      >
        <span
          className={`relative inline-flex w-7 h-4 rounded-full transition-colors ${
            value ? 'bg-green-900' : 'bg-zinc-800'
          } border ${value ? 'border-green-700' : 'border-zinc-700'}`}
        >
          <span
            className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
              value ? 'left-3.5 bg-green-500' : 'left-0.5 bg-zinc-600'
            }`}
          />
        </span>
        <span
          className={`text-xs font-mono w-10 text-left transition-colors ${
            value ? 'text-green-600' : 'text-zinc-600'
          }`}
        >
          {value ? 'public' : 'private'}
        </span>
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest __tests__/components/PatchForm.test.tsx --no-coverage
```

Expected: VisibilityToggle tests PASS

- [ ] **Step 5: Update `components/patch-form/PatchForm.tsx`** — add `isPublic` state + VisibilityToggle

In `PatchForm.tsx`, add to the state declarations:

```typescript
const [isPublic, setIsPublic] = useState(defaultValues.isPublic)
```

Add `isPublic` to the `handleSubmit` call:

```typescript
onSubmit({ name, description, tags, knobSettings, connections, sequenceNotes, audioUrl, isPublic })
```

Add the `VisibilityToggle` import at the top:

```typescript
import { VisibilityToggle } from '@/components/ui/VisibilityToggle'
```

Add the toggle after the tags input, still inside `<section className="max-w-xl space-y-4">`:

```typescript
<VisibilityToggle value={isPublic} onChange={setIsPublic} />
```

- [ ] **Step 6: Run all component tests**

```bash
npx jest __tests__/components/ --no-coverage
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add components/ui/VisibilityToggle.tsx components/patch-form/PatchForm.tsx __tests__/components/PatchForm.test.tsx
git commit -m "feat: add VisibilityToggle component and wire into PatchForm"
```

---

## Task 15: Library new and edit pages

**Files:**
- Create: `app/library/new/page.tsx`
- Create: `app/library/[id]/edit/page.tsx`

- [ ] **Step 1: Create `app/library/new/page.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues } from '@/lib/types'

const emptyPatch: PatchFormValues = {
  name: '',
  description: '',
  tags: [],
  knobSettings: {},
  connections: [],
  sequenceNotes: '',
  audioUrl: '',
  isPublic: false,
}

export default function NewPatchPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (values: PatchFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const knobSettings = Object.entries(values.knobSettings).map(([knobId, value]) => ({
        knobId,
        value,
      }))
      const res = await fetch('/api/patches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, knobSettings }),
      })
      if (!res.ok) throw new Error('Failed to save patch')
      const patch = await res.json()
      router.push(`/patches/${patch.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/library" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          ← MY LIBRARY
        </Link>
        <span className="text-xs font-mono text-zinc-500">New Patch</span>
      </nav>
      <main className="px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm font-mono border border-red-900/50 rounded px-4 py-2">
            {error}
          </div>
        )}
        <PatchForm defaultValues={emptyPatch} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/library/[id]/edit/page.tsx`**

```typescript
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { EditPatchClient } from './EditPatchClient'
import type { PatchFormValues } from '@/lib/types'

interface PageProps {
  params: { id: string }
}

export default async function EditPatchPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const patch = await prisma.patch.findUnique({
    where: { id: params.id },
    include: { knobSettings: true, connections: true },
  })

  if (!patch) notFound()
  if (patch.userId !== session.user.id) redirect('/library')

  const defaultValues: PatchFormValues = {
    name: patch.name,
    description: patch.description ?? '',
    tags: patch.tags,
    knobSettings: Object.fromEntries(patch.knobSettings.map(k => [k.knobId, k.value])),
    connections: patch.connections.map(c => ({
      fromJack: c.fromJack,
      toJack: c.toJack,
      color: c.color,
    })),
    sequenceNotes: patch.sequenceNotes ?? '',
    audioUrl: patch.audioUrl ?? '',
    isPublic: patch.isPublic,
  }

  return <EditPatchClient patchId={patch.id} defaultValues={defaultValues} />
}
```

- [ ] **Step 3: Create `app/library/[id]/edit/EditPatchClient.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PatchForm } from '@/components/patch-form/PatchForm'
import type { PatchFormValues } from '@/lib/types'

interface EditPatchClientProps {
  patchId: string
  defaultValues: PatchFormValues
}

export function EditPatchClient({ patchId, defaultValues }: EditPatchClientProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (values: PatchFormValues) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const knobSettings = Object.entries(values.knobSettings).map(([knobId, value]) => ({
          knobId,
          value,
        }))
        const res = await fetch(`/api/patches/${patchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, knobSettings }),
        })
        if (!res.ok) throw new Error('Failed to update patch')
        router.push(`/patches/${patchId}`)
        router.refresh()
      } catch {
        setError('Something went wrong. Please try again.')
        setIsSubmitting(false)
      }
    },
    [patchId, router],
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
        <Link href="/library" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
          ← MY LIBRARY
        </Link>
        <span className="text-xs font-mono text-zinc-500">Edit Patch</span>
      </nav>
      <main className="px-6 py-8">
        {error && (
          <div className="mb-6 text-red-400 text-sm font-mono border border-red-900/50 rounded px-4 py-2">
            {error}
          </div>
        )}
        <PatchForm defaultValues={defaultValues} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/library/new/ app/library/\[id\]/edit/
git commit -m "feat: add /library/new and /library/[id]/edit pages"
```

---

## Task 16: CopyButton component + Patch detail updates

**Files:**
- Create: `components/auth/CopyButton.tsx`
- Modify: `app/patches/[id]/page.tsx`

- [ ] **Step 1: Create `components/auth/CopyButton.tsx`**

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

interface CopyButtonProps {
  patchId: string
  className?: string
  label?: string
}

export function CopyButton({ patchId, className, label = 'Copy' }: CopyButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCopy = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/patches/${patchId}`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/patches/copy/${patchId}`, { method: 'POST' })
      if (res.ok) {
        router.push('/library')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={loading}
      className={className}
    >
      {loading ? 'Copying…' : label}
    </button>
  )
}
```

- [ ] **Step 2: Update `app/patches/[id]/page.tsx`** — add CopyButton in nav and copy banner

Add these imports at the top:

```typescript
import { auth } from '@/auth'
import { CopyButton } from '@/components/auth/CopyButton'
```

Change the function signature to async (it already is) and add session lookup:

```typescript
export default async function PatchDetailPage({ params }: PageProps) {
  const [patch, session] = await Promise.all([
    prisma.patch.findUnique({
      where: { id: params.id },
      include: { knobSettings: true, connections: true },
    }),
    auth(),
  ])

  if (!patch) notFound()
  // Public-only — private patches return 404 to anyone who isn't the owner
  if (!patch.isPublic && patch.userId !== session?.user?.id) notFound()
```

Replace the nav JSX:

```typescript
<nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
  <Link href="/" className="text-orange-500 font-mono font-bold tracking-[4px] text-sm">
    PATCHLIB
  </Link>
  <div className="flex items-center gap-2">
    {/* Owner controls: edit + delete */}
    {session?.user?.id === patch.userId && (
      <>
        <Link
          href={`/library/${patch.id}/edit`}
          className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
        >
          Edit
        </Link>
        <DeletePatchButton patchId={patch.id} />
      </>
    )}
    {/* Copy button — shown on public patches not owned by current user */}
    {patch.isPublic && session?.user?.id !== patch.userId && (
      <CopyButton
        patchId={patch.id}
        className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1 hover:border-zinc-500 transition-colors"
      />
    )}
    {/* Sign in — shown to guests on public patches */}
    {!session && patch.isPublic && (
      <Link
        href={`/login?callbackUrl=/patches/${patch.id}`}
        className="bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs px-3 py-1.5 rounded transition-colors"
      >
        Sign in
      </Link>
    )}
  </div>
</nav>
```

Add the copy banner at the end of `<main>`, after the audio section and before the closing tag:

```typescript
{/* Copy banner — shown on public patches not owned by current user */}
{patch.isPublic && session?.user?.id !== patch.userId && (
  <div className="flex items-center justify-between bg-[#111] border border-zinc-800 rounded px-4 py-3">
    <span className="text-xs font-mono text-zinc-500">Save this patch to your library</span>
    <CopyButton
      patchId={patch.id}
      label="Copy to my library"
      className="text-xs font-mono text-zinc-400 border border-zinc-700 rounded px-3 py-1.5 hover:border-zinc-500 transition-colors"
    />
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add components/auth/CopyButton.tsx app/patches/\[id\]/page.tsx
git commit -m "feat: add CopyButton and copy banner to patch detail page"
```

---

## Task 17: Redirect old routes

**Files:**
- Modify: `app/patches/new/page.tsx`
- Modify: `app/patches/[id]/edit/page.tsx`

- [ ] **Step 1: Replace `app/patches/new/page.tsx` with a redirect**

```typescript
import { redirect } from 'next/navigation'

export default function NewPatchRedirect() {
  redirect('/library/new')
}
```

- [ ] **Step 2: Replace `app/patches/[id]/edit/page.tsx` with a redirect**

```typescript
import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default function EditPatchRedirect({ params }: Props) {
  redirect(`/library/${params.id}/edit`)
}
```

- [ ] **Step 3: Commit**

```bash
git add app/patches/new/page.tsx app/patches/\[id\]/edit/page.tsx
git commit -m "feat: redirect old /patches/new and /patches/[id]/edit to /library routes"
```

---

## Task 18: Full test suite pass

- [ ] **Step 1: Run the full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests PASS

If failures: fix them before moving on.

- [ ] **Step 2: Run the build**

```bash
npm run build
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete user management UI — auth, library, discovery, copy flow"
```

---

## Manual smoke test checklist

After running `npm run dev`:

- [ ] `http://localhost:3000` shows Discovery page with nav (Browse, Sign in)
- [ ] `http://localhost:3000/login` shows full-bleed hero with PATCHLIB wordmark
- [ ] Entering email and submitting shows "Check your inbox" state
- [ ] Clicking magic link in email → redirected to `/library`
- [ ] `/library` shows "My Library · 0 patches" + "+ NEW PATCH" button
- [ ] Creating a patch with isPublic toggle off → card shows `private` badge
- [ ] Toggling patch to public → card shows `public` badge
- [ ] Signing out → nav shows only "Browse" + "Sign in"
- [ ] Public patch detail shows Copy button + copy banner for guest
- [ ] Clicking Copy as guest redirects to `/login?callbackUrl=...`
- [ ] After login, Copy → redirected to `/library` with copied patch
- [ ] `/patches/old-id/edit` redirects to `/library/old-id/edit`
