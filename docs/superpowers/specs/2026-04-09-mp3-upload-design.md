# MP3 Upload & Playback — Design Spec

**Date:** 2026-04-09  
**Status:** Approved

---

## Summary

Add MP3 upload and inline playback to patches. Users can attach one audio file per patch (max 10 MB), preview it while editing, and play it back from the detail page. The patch list shows a ♪ indicator on patches that have audio.

---

## Architecture

### Storage: AWS S3

Files are stored in a dedicated S3 bucket (`patchlib-audio`). The bucket has public read access so audio URLs can be streamed directly from the browser without authentication.

Upload bypasses Vercel's 4.5 MB request body limit via **presigned PUT URLs**: the client requests a short-lived upload URL from our API, then sends the file directly to S3. The resulting S3 URL is saved as `audioUrl` on the Patch record.

No changes to the Prisma schema — `audioUrl: String?` already exists on `Patch`.

### Data flow

```
User picks file
  → client validates (MP3, ≤ 10 MB)
  → POST /api/audio/presign  { filename, contentType }
  → API returns { uploadUrl, publicUrl }  (presigned PUT, 5 min TTL)
  → client PUTs file directly to S3
  → client sets audioUrl = publicUrl
  → audioUrl saved with patch on form submit
```

### S3 object path

```
audio/{cuid}.mp3
```

A fresh CUID per upload avoids name collisions and makes old files easy to identify if manual cleanup is ever needed.

### CORS (S3 bucket policy)

- PUT: allowed from Vercel production domain + localhost (for dev)
- GET: allowed from all origins (public read for playback)

---

## Components

### `components/audio/AudioUpload.tsx`  (client)

Used inside `PatchForm`. Manages the full upload lifecycle.

**States:**
1. **Empty** — "＋ Attach MP3" button + "max 10 MB" hint
2. **Uploading** — progress indicator, button disabled
3. **Ready** — mini waveform player (play/pause, animated bars, timestamp, ✕ remove)

**Validation (client-side before upload):**
- File type: `audio/mpeg` or `.mp3` extension
- File size: ≤ 10 MB — shows inline error if exceeded, no upload attempt

**Props:**
```ts
interface AudioUploadProps {
  value: string       // current audioUrl (empty string if none)
  onChange: (url: string) => void
}
```

Removing the file sets `onChange("")` — the existing audioUrl is cleared on save. Orphaned S3 objects are acceptable for this MVP (no active deletion needed).

### `components/audio/AudioPlayer.tsx`  (client)

Used on the patch detail page. Displays the waveform player.

**Design:** Simulated waveform — 40 vertical bars of randomized heights (seeded from the filename so the pattern is stable across renders). Orange bars = played portion, grey = remaining, brighter orange bar = playhead.

**Controls:** Play/Pause button (orange circle), timestamp (current / total), download link (↓).

**Props:**
```ts
interface AudioPlayerProps {
  src: string      // S3 public URL
  filename?: string
}
```

Uses the HTML5 `Audio` API via `useRef`. Updates progress on `timeupdate` event.

### `app/api/audio/presign/route.ts`

```
POST /api/audio/presign
Body: { filename: string, contentType: string }
Returns: { uploadUrl: string, publicUrl: string }
```

- Generates a CUID for the S3 key
- Creates a presigned PUT URL (5 minute expiry) via `@aws-sdk/s3-request-presigner`
- Returns both the upload URL and the future public URL
- Validates `contentType === "audio/mpeg"` server-side

No auth needed for this MVP (small trusted user group).

---

## UI Changes

### PatchForm (`components/patch-form/PatchForm.tsx`)

Replace the existing `<input type="url">` for `audioUrl` with `<AudioUpload>`. The Notes section becomes:

```
[ Notes section — textarea unchanged ]
[ Audio section ]
  + Attach MP3  ·  max 10 MB
  → after upload: mini waveform player
```

### Patch Detail (`app/patches/[id]/page.tsx`)

Replace the existing `<a href={patch.audioUrl}>` link with `<AudioPlayer src={patch.audioUrl} />` inside the existing "Audio Reference" section.

### PatchCard (`components/library/PatchCard.tsx`)

Add a `♪` indicator next to the cable count when `patch.audioUrl` is set:

```
3 cables  ♪  bass  kick
```

Requires `audioUrl` to be included in the `PatchListItem` type and the `findMany` query.

---

## Infrastructure

### S3 Bucket (`patchlib-audio`, us-east-1)

- Public read via bucket policy
- CORS configured for PUT from app domains
- No versioning needed
- No lifecycle rules needed for MVP

### Environment Variables (added to `.env.local` + Vercel)

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AUDIO_BUCKET_NAME=patchlib-audio
```

A dedicated IAM user with minimal permissions: `s3:PutObject` + `s3:GetObject` on `patchlib-audio/*`.

---

## Out of Scope (MVP)

- Real waveform analysis (Web Audio API decoding) — simulated bars are sufficient
- Deleting S3 objects when a patch is deleted or audio replaced
- Multiple audio files per patch
- Audio format conversion / transcoding
- Access control on S3 URLs
