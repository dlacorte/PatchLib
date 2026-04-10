# PatchLib

> A patch library for analog synthesizers — because analog has no memory.

## The Problem

Analog semi-modular synthesizers are powerful but stateless. Every knob position, every cable connection, every sequence step exists only in the physical moment. The moment you move on to the next sound, the previous patch is gone forever — unless you photographed it, drew a diagram, or kept meticulous notes.

Most people don't. Most patches are lost.

## The Solution

PatchLib is a personal web app that lets you document, save, and retrieve your synthesizer patches. For each patch you store:

- **Knob settings** — every parameter value, labeled by section
- **Patch bay connections** — which jack connects to which, with color-coded cables
- **Sequence notes** — BPM, step values, performance tips
- **Audio recording** — an MP3 reference so you know exactly what it sounds like
- **Tags** — organize by character (bass, kick, drone, lead, ambient…)

When you want to recreate a sound, open PatchLib, find your patch, and reconstruct it knob by knob and cable by cable. No guessing.

## Features

- **Full patch documentation** — knobs, cables, notes in one place
- **Audio upload & playback** — attach an MP3 directly to each patch, play it back inline with a waveform player
- **Search** — find patches by name or description
- **Tag filtering** — browse by sound character
- **Audio indicator** — see at a glance which patches have a recording attached (♪)
- **Responsive dark UI** — built to match the aesthetic of the hardware it documents

## Supported Devices

| Device | Status |
|---|---|
| Moog DFAM (Drummer From Another Mother) | ✅ Supported |
| Moog Subharmonicon | 🔜 Planned |
| Moog Mother-32 | 🔜 Planned |

## Screenshots

_Coming soon._

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| Database | Aurora Serverless v2 (PostgreSQL) via Prisma |
| File Storage | AWS S3 (presigned direct upload) |
| Deployment | AWS (Lambda + CloudFront via SST Ion) |
| CI/CD | GitHub Actions (push to main → deploy) |

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/dlacorte/PatchLib.git
cd PatchLib
npm install

# 2. Set up environment
cp .env.example .env.local
# Fill in DATABASE_URL and AUDIO_* variables (see below)

# 3. Set up database
npx prisma generate
npx prisma db push

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUDIO_BUCKET_NAME` | S3 bucket name for audio files |
| `AUDIO_AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AUDIO_AWS_ACCESS_KEY_ID` | IAM key with `s3:PutObject` on the bucket |
| `AUDIO_AWS_SECRET_ACCESS_KEY` | IAM secret key |

## Tests

```bash
npm test
```

77 tests across API routes, React components, and utility functions.

## License

MIT
