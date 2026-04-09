# User Management Design

**Date:** 2026-04-09
**Status:** Approved

## Problem

PatchLib is currently a single-tenant app with no auth. Any visitor can create, edit, or delete any patch. To become an open platform where multiple users maintain their own patch libraries, we need identity, ownership, and a public/private visibility model.

## Goals

- Any person can sign up and maintain their own patch library
- Users authenticate via Magic Link (no passwords)
- Each patch is either private (owner only) or public (discoverable by anyone)
- Visitors can browse and copy public patches without creating an account first (copy triggers login)
- All existing patches are deleted — fresh start

## Non-Goals

- Social features (likes, comments, follows)
- Admin roles or moderation tools
- OAuth providers (Google, GitHub, etc.)
- Email verification beyond the magic link itself

---

## Architecture

**Auth:** Auth.js v5 (formerly NextAuth) with the built-in `EmailProvider` for magic links and the official `@auth/prisma-adapter` for session persistence.

**Email transport:** Amazon SES via AWS SDK v3. A custom `sendVerificationRequest` function replaces the default nodemailer transport.

**Sessions:** Database sessions managed by Auth.js + Prisma adapter. Session token stored as a secure HTTP-only cookie.

**Middleware:** Next.js middleware protects all `/library/*` routes. Unauthenticated requests are redirected to `/login`.

---

## Data Model

### New models (required by Auth.js Prisma Adapter)

```prisma
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
```

### Changes to existing models

`Patch` gets two new fields:

```prisma
model Patch {
  // ... existing fields ...
  userId   String
  isPublic Boolean @default(false)
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Migration strategy

All existing Patch, KnobSetting, and CableConnection rows are deleted before running the migration. This avoids nullable `userId` hacks.

---

## Routing

### Open area (no auth required)

| Route | Description |
|---|---|
| `GET /` | Discovery page — all public patches from all users, searchable and filterable |
| `GET /patches/[id]` | Patch detail — only accessible if `isPublic: true`, returns 404 otherwise |
| `GET /login` | Magic link request form |

### Protected area (auth required)

| Route | Description |
|---|---|
| `GET /library` | User's own patch library — all patches (public + private) |
| `GET /library/new` | Create new patch |
| `GET /library/[id]/edit` | Edit patch — server validates ownership, returns 403 if not owner |

Next.js middleware redirects all `/library/*` requests to `/login` if no valid session exists.

---

## Auth Flow

1. User enters email at `/login`
2. Auth.js generates a one-time token and calls `sendVerificationRequest`
3. `sendVerificationRequest` sends the magic link via Amazon SES
4. User clicks the link in their email
5. Auth.js verifies the token, creates or updates the `User` record, creates a `Session`
6. User is redirected to `/library`

**Token expiry:** 24 hours (Auth.js default).

**New users:** A `User` record is automatically created on first login by the Prisma adapter. No separate signup step.

---

## Visibility Model

- `isPublic: false` (default) — patch is only visible in `/library` to its owner. `/patches/[id]` returns 404 for anyone else.
- `isPublic: true` — patch appears on the discovery page `/` and its detail page `/patches/[id]` is accessible to anyone.

The visibility toggle appears in the patch create/edit form, labeled "Make this patch public". Default is off.

---

## Copy-to-Library Flow

On any public patch detail page (`/patches/[id]`), a "Copy to my library" button is shown.

- **Not logged in:** clicking the button redirects to `/login?callbackUrl=/patches/[id]`. Auth.js reads `callbackUrl` and redirects the user back to the patch detail page after successful login.
- **Logged in:** a `POST /api/patches/copy/[id]` request is made. The API creates a new `Patch` record with all the same knob settings, cable connections, sequence notes, and metadata — but with the current user's `userId` and `isPublic: false`.

---

## Navigation

### Unauthenticated header

```
PatchLib    |    Browse    Sign in
```

### Authenticated header

```
PatchLib    |    Browse    My Library    |    user@email.com    Sign out
```

---

## Environment Variables

Two new variables required:

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Random secret for Auth.js session signing (generate with `openssl rand -base64 32`) |
| `AUTH_EMAIL_FROM` | Verified SES sender address (e.g. `noreply@patchlib.app`) |

Existing `AUDIO_AWS_*` credentials are reused for SES — no additional IAM key needed (the existing key must be granted `ses:SendEmail`).

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Expired magic link | Auth.js shows its built-in error page; user can request a new link |
| Non-owner accesses `/library/[id]/edit` | Server-side ownership check → HTTP 403 |
| `/patches/[id]` on a private patch | HTTP 404 (does not reveal patch existence) |
| SES send failure | Login page shows generic "Could not send email" message, no stack trace |

---

## Tests

New tests to add alongside existing suite:

- `GET /api/patches` returns 401 when no session
- `POST /api/patches` returns 401 when no session
- `POST /api/patches/copy/[id]` creates patch with correct `userId` and `isPublic: false`
- `GET /patches/[id]` returns 404 for private patch when not authenticated
- `GET /patches/[id]` returns 404 for private patch when authenticated as non-owner
- Middleware redirects `/library` to `/login` when no session cookie present
- Edit API returns 403 when authenticated user does not own the patch
