# PatchLib

A personal patch library for Moog semi-modular synthesizers. Analog gear has no memory — knob positions, cable routings, and sequence settings disappear the moment you move on. PatchLib lets you document everything: knob values, patch bay connections, notes, and an audio recording so you can reconstruct any sound exactly as you had it.

## What it does

- **Save patches** — document knob positions and patch bay cable connections
- **Audio recording** — attach an MP3 reference so you know what the patch actually sounds like
- **Search & filter** — find patches by name, description, or tags
- **Tag system** — organize by character (bass, kick, drone, ambient…)

## Supported devices

| Device | Status |
|---|---|
| Moog DFAM (Drummer From Another Mother) | ✅ Supported |
| Moog Subharmonicon | 🔜 Planned |
| Moog Mother-32 | 🔜 Planned |

## Tech stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Database:** Aurora Serverless v2 (PostgreSQL) via Prisma
- **Storage:** AWS S3 (audio files, presigned upload)
- **Deployment:** Vercel

## Local development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in DATABASE_URL and AUDIO_* variables

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Aurora/Neon/local) |
| `AUDIO_BUCKET_NAME` | S3 bucket for audio files |
| `AUDIO_AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AUDIO_AWS_ACCESS_KEY_ID` | IAM access key with `s3:PutObject` on the bucket |
| `AUDIO_AWS_SECRET_ACCESS_KEY` | IAM secret key |

## Tests

```bash
npm test
```

77 tests across API routes, components, and utility functions.
