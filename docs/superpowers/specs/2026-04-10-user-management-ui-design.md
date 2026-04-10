# User Management — Frontend UI Design Spec
Date: 2026-04-10
Status: Approved

## Overview

This spec covers the frontend UI for adding user authentication and ownership to PatchLib. The backend architecture (Auth.js v5, magic links, Prisma adapter) is defined in `2026-04-09-user-management-design.md`. This document covers only the UI layer: screen designs, component changes, and interaction details.

Chosen approach: **Klare Trennung — Discovery vs. Workspace**. Discovery (`/`) and Library (`/library`) are separate pages with the same card component, but Library cards carry visibility badges. Clear nav links distinguish the two contexts.

---

## Route Structure

| Route | Auth | Description |
|---|---|---|
| `/` | open | Discovery — all public patches from all users, search + tag filter |
| `/patches/[id]` | open | Patch detail — public patches only, 404 for private |
| `/login` | open | Magic link request form |
| `/library` | required | User's own patches (public + private) with visibility badges |
| `/library/new` | required | Create new patch |
| `/library/[id]/edit` | required | Edit patch — server validates ownership |

Middleware redirects all `/library/*` to `/login` when no session exists.

---

## Navigation

### Guest (no session)

```
PATCHLIB          Browse          Sign in
```

- `PATCHLIB` — logo, links to `/`
- `Browse` — active link, links to `/`
- `Sign in` — orange primary button (`bg-orange-500 text-black font-bold rounded`), links to `/login`

### Authenticated — on Browse

```
PATCHLIB          Browse  My Library          user@email.com  Sign out
```

- `Browse` — active (underline accent)
- `My Library` — inactive, links to `/library`
- `user@email.com` — muted, non-interactive
- `Sign out` — ghost button (border, no fill)

### Authenticated — on My Library

```
PATCHLIB          Browse  My Library          user@email.com  Sign out
```

- `Browse` — inactive
- `My Library` — active (underline accent)

Nav is sticky, `bg-[#0a0a0a]`, `border-b border-zinc-800`, consistent with existing screens.

---

## Login Page (`/login`)

**Layout:** Full-bleed hero. Two states.

### Form state

```
┌─ PATCHLIB ────────────────────────────────────────────┐
│ (topbar logo, border-b)                               │
│                                                       │
│              PATCHLIB                                 │
│         Your Analog Patch Library                     │
│                                                       │
│         [ your@email.com              ]               │
│         [ SEND MAGIC LINK             ]               │
│                                                       │
│    We'll send a one-time link to your inbox.          │
│    No password required.                              │
│                                                       │
├───────────────────────────────────────────────────────┤
│ DFAM · SUBHARMONICON · MOTHER-32    Browse without account → │
└───────────────────────────────────────────────────────┘
```

- `PATCHLIB` wordmark: `text-2xl font-bold text-orange-500 tracking-[0.25em]`
- Tagline: `text-[11px] text-zinc-700 tracking-[0.2em] uppercase`
- Email input: existing input style (`bg-[#111] border-zinc-800`)
- Button: existing primary button style (`bg-orange-500 text-black font-bold`)
- "Browse without account" link in footer: links to `/`, `text-zinc-700 hover:text-zinc-500`

### Post-send state (after form submit)

```
┌─ PATCHLIB ────────────────────────────────────────────┐
│                                                       │
│                    ✉                                  │
│              Check your inbox                         │
│                                                       │
│         We sent a magic link to                       │
│              your@email.com                           │
│         The link expires in 24 hours.                 │
│                                                       │
├───────────────────────────────────────────────────────┤
│ ↺ Resend                     Wrong address? Start over │
└───────────────────────────────────────────────────────┘
```

- No redirect needed — replace form content in place on submit
- "Resend" calls the same form action again
- "Start over" resets to form state

---

## Discovery Page (`/`)

Replaces the current library page. Same layout as today, with two additions:

1. **Owner label on cards:** `by <displayName or email-prefix>` shown in card meta row alongside cable count and date.
2. **Nav state:** "Browse" active, "My Library" only shown when authenticated.

No other changes to the existing card or filter components.

### PatchCard — Discovery variant

```
┌────────────────────────────────────────────┐
│ Heavy Kick           [DFAM]                │
│ 3 cables · by janko · ♪         Mar 15     │
└────────────────────────────────────────────┘
```

Owner shown as `by <name>` — uses `user.displayName` if set, otherwise the part of the email before `@`.

---

## My Library (`/library`)

Same card layout as Discovery, but:

1. **Visibility badge** on every card (right-aligned, opposite the patch name).
2. **"+ NEW PATCH" button** in a sub-header row above the search bar.
3. **No owner label** — all patches belong to the current user.

### PatchCard — Library variant

```
┌────────────────────────────────────────────────┐
│ Heavy Kick           [DFAM]     [private]       │
│ 3 cables · ♪                        Mar 15      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Acid Loop            [DFAM]     [public]        │
│ 2 cables                            Mar 12      │
└────────────────────────────────────────────────┘
```

Badge styles:
- `private` — `text-zinc-600 border-zinc-800` (muted, default state)
- `public` — `text-green-600 border-green-900` (green, stands out)

### Sub-header

```
My Library · N patches        [+ NEW PATCH]
```

Sits between nav and search bar. Patch count is server-rendered. "+ NEW PATCH" links to `/library/new`.

---

## Patch Detail (`/patches/[id]`)

Public-only page. Two additions:

### Nav changes

```
← PATCHLIB                    [Copy]  [Sign in]   ← guest
← PATCHLIB                    [Copy]              ← authenticated
```

- `Copy` button: ghost style (`border border-zinc-700 text-zinc-400`), always visible on public patches
- `Sign in` button: orange primary, only shown when not authenticated
- Clicking `Copy` when not logged in → redirects to `/login?callbackUrl=/patches/[id]`
- Clicking `Copy` when logged in → `POST /api/patches/copy/[id]` → on success, redirect to `/library`

### Copy banner

Below all patch content, above the page bottom:

```
┌──────────────────────────────────────────────────────┐
│ Save this patch to your library   [Copy to my library]│
└──────────────────────────────────────────────────────┘
```

- Narrow row, `bg-[#111] border border-zinc-800`
- Ghost button on right: same style as nav Copy button
- Both nav button and banner button trigger the same action
- Hidden on the user's own patches (no copy of own work)

---

## Patch Form — Visibility Toggle

### Placement

Inside the existing "Patch Info" section, as the last field after the tags input.

```
[ Patch name                    ]
[ Description (optional)        ]
[ Tags: bass, kick, drone…      ]
┌──────────────────────────────────────────┐
│ Make this patch public      [○] private  │
└──────────────────────────────────────────┘
```

### Toggle states

| State | Track | Thumb | Label | Row border |
|---|---|---|---|---|
| off (default) | `bg-zinc-800` | `bg-zinc-600` | `private` `text-zinc-600` | `border-zinc-800` |
| on | `bg-green-900` | `bg-green-500` | `public` `text-green-600` | `border-green-900` |

No confirmation dialog. Toggle is immediate in form state, saved on "Save Patch".

---

## Component Changes Summary

| Component | Change |
|---|---|
| `app/layout.tsx` | Auth session provider wrapper |
| `app/page.tsx` | Discovery page — add owner label to PatchList query, rename route semantics |
| `app/library/page.tsx` | New — user's own patches with visibility badges |
| `app/library/new/page.tsx` | New — replaces `/patches/new` for authenticated users |
| `app/library/[id]/edit/page.tsx` | New — replaces `/patches/[id]/edit` |
| `app/patches/new/page.tsx` | Remove — redirect to `/library/new` |
| `app/patches/[id]/edit/page.tsx` | Remove — redirect to `/library/[id]/edit` |
| `app/login/page.tsx` | New — full-bleed hero, magic link form + post-send state |
| `app/patches/[id]/page.tsx` | Add Copy button to nav + copy banner |
| `components/library/PatchCard.tsx` | Add `variant` prop: `"discovery"` (owner label) or `"library"` (visibility badge) |
| `components/patch-form/PatchForm.tsx` | Add visibility toggle field |
| `components/ui/VisibilityToggle.tsx` | New — toggle switch component |
| `components/auth/CopyButton.tsx` | New — handles auth-aware copy action |
| `middleware.ts` | New — protects `/library/*` routes |

---

## Auth-Aware Rendering

All auth state reads use `auth()` from Auth.js (server components) or `useSession()` (client components).

- Nav: server component reads session, renders appropriate links
- Copy button: client component, checks session client-side for optimistic UI, falls back to server action
- Visibility toggle: client component within existing `PatchForm`

---

## Out of Scope

- Avatar/profile image display
- Display name editing
- Email change flow
- Account deletion
- Admin tools
