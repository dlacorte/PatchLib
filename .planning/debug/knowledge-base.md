# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## mp3-upload-failed — Vercel env vars with trailing whitespace break AWS SDK hostname validation
- **Date:** 2026-04-09
- **Error patterns:** upload failed, presign, 500, region not accepted, trailing space, trailing newline, AWS SDK, S3, AUDIO_AWS_REGION, AUDIO_BUCKET_NAME, AUDIO_AWS_ACCESS_KEY_ID, AUDIO_AWS_SECRET_ACCESS_KEY
- **Root cause:** All four AUDIO_* environment variables on Vercel were saved with trailing whitespace/newlines (likely from pasting in the dashboard). The AWS SDK hostname validator rejects a region string with whitespace, causing an unhandled 500 from the presign route. Bucket name and access key ID also had embedded newlines that corrupted S3 URLs.
- **Fix:** Removed and re-added all four vars using `printf 'value' | vercel env add ...` (printf omits trailing newline). Rotated IAM key pair. Redeployed.
- **Files changed:** (none — infrastructure fix only)
---
