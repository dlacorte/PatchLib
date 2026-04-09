---
status: resolved
trigger: "MP3 upload shows 'Upload failed — try again' on production (Vercel + AWS S3)"
created: 2026-04-09T00:00:00Z
updated: 2026-04-09T17:54:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED — All four AUDIO_* env vars on Vercel had trailing whitespace/newlines from being pasted via the Vercel dashboard. Fixed by re-adding all four using `printf` (which omits trailing newlines) + rotated IAM key pair since old secret was unrecoverable.
test: curl presign → 200 with clean URLs; PUT to presigned URL → S3 200
expecting: user can now attach an MP3 in the PatchForm without error
next_action: human verifies upload works end-to-end in browser

## Symptoms

expected: User picks an MP3 file, it uploads to S3, and the mini waveform player appears.
actual: "Upload failed — try again" error message appears. The upload never completes.
errors: Caught in handleFile in components/audio/AudioUpload.tsx — either POST /api/audio/presign fails or subsequent PUT to S3 fails.
reproduction: Open https://patch-lib.vercel.app, edit any patch, attach an MP3 file in the Audio section.
started: Immediately after first deployment today. Never worked in production.

## Eliminated

- hypothesis: S3 CORS misconfiguration
  evidence: `aws s3api get-bucket-cors` showed correct AllowedOrigins and AllowedMethods. CORS is fine.
  timestamp: 2026-04-09T17:51:00Z

- hypothesis: IAM policy missing permissions
  evidence: `aws iam get-user-policy` confirmed s3:PutObject + s3:GetObject on patchlib-audio/* — correct.
  timestamp: 2026-04-09T17:51:00Z

- hypothesis: Env vars not set on Vercel
  evidence: `vercel env ls` showed all four AUDIO_* vars present on Production.
  timestamp: 2026-04-09T17:51:00Z

## Evidence

- timestamp: 2026-04-09T17:51:00Z
  checked: POST https://patch-lib.vercel.app/api/audio/presign (live curl)
  found: HTTP 500 with empty body
  implication: Failure is at presign step, not S3 PUT step

- timestamp: 2026-04-09T17:51:00Z
  checked: Vercel function logs for latest deployment
  found: `Error: Region not accepted: region="us-east-1 " is not a valid hostname component.` — note the trailing space in the region string
  implication: AUDIO_AWS_REGION was stored with a trailing space on Vercel

- timestamp: 2026-04-09T17:53:00Z
  checked: Presigned URL returned after fixing AUDIO_AWS_REGION only
  found: URL contained `patchlib-audio%0A` and `X-Amz-Credential=AKIAUT2KXJTNAVF4BM6Z%0A` — newlines in bucket name and access key ID
  implication: AUDIO_BUCKET_NAME and AUDIO_AWS_ACCESS_KEY_ID also had trailing newlines; all four vars were affected

- timestamp: 2026-04-09T17:54:00Z
  checked: POST presign after fixing all four vars + redeploying
  found: HTTP 200, clean URLs — `patchlib-audio.s3.us-east-1.amazonaws.com`, credential without %0A
  implication: Presign API is fully functional

- timestamp: 2026-04-09T17:54:00Z
  checked: PUT to presigned URL with 1KB random payload
  found: HTTP 200 from S3
  implication: End-to-end upload path works

## Resolution

root_cause: All four AUDIO_* environment variables on Vercel (AUDIO_AWS_REGION, AUDIO_BUCKET_NAME, AUDIO_AWS_ACCESS_KEY_ID, AUDIO_AWS_SECRET_ACCESS_KEY) were saved with trailing whitespace/newlines — likely introduced by pasting into the Vercel dashboard which included a trailing newline. The AWS SDK's hostname validator rejects region strings with whitespace, causing an unhandled exception in the presign route and a 500 response. AUDIO_BUCKET_NAME and AUDIO_AWS_ACCESS_KEY_ID also had embedded newlines (\n / %0A) that would have corrupted S3 URLs even after the region fix.
fix: Removed and re-added all four env vars using `printf 'value' | vercel env add ...` (printf omits trailing newline, unlike echo). Rotated the IAM access key pair since the old secret key was unrecoverable from Vercel (encrypted). Redeployed to production.
verification: POST /api/audio/presign → HTTP 200 with clean URLs. PUT to presigned S3 URL → HTTP 200.
files_changed: []
