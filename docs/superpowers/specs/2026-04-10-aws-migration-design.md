# AWS Migration Design Spec
Date: 2026-04-10
Status: Approved

## Overview

Migrate PatchLib from Vercel to AWS to consolidate all infrastructure in one AWS account. The app currently runs on Vercel (Next.js hosting) while Aurora Serverless v2, S3, and SES already live in AWS. After migration, everything runs in AWS.

**Motivation:** Vendor consolidation — eliminate Vercel as a second platform.  
**Cost target:** Near-zero — $0.50/month more than current setup (Route53 hosted zone).

---

## Architecture

```
GitHub (push to main)
    └── GitHub Actions
            └── sst deploy --stage production
                    ↓
            SST Ion (Pulumi)
                    ↓
    ┌──────────────────────────────────────┐
    │                AWS                   │
    │                                      │
    │  Route53 (patchlib.app)              │
    │      ↓                               │
    │  ACM Certificate (us-east-1)         │
    │      ↓                               │
    │  CloudFront Distribution             │
    │    ├── /(_next/static)/* → S3        │
    │    ├── /favicon.ico → S3             │
    │    └── /* → Lambda (OpenNext)        │
    │                ↓                     │
    │    Lambda (Next.js SSR + API routes) │
    │      ├── Aurora Serverless v2        │
    │      │   (via RDS Data API — HTTP)   │
    │      ├── S3 (presigned audio URLs)   │
    │      └── SES (magic link emails)     │
    └──────────────────────────────────────┘
```

**No VPC for Lambda.** Lambda in a VPC requires a NAT Gateway (~$32–45/month) for internet access (SES, S3). Instead:
- Aurora is accessed via **RDS Data API** (HTTP-based, no VPC required)
- S3 and SES are accessed directly via public AWS endpoints
- This keeps Lambda outside the VPC and cost near zero

---

## Infrastructure Components

### SST Ion (`sst.config.ts`)
Infrastructure as code living in the repo. Defines:
- CloudFront distribution with S3 origin (static) + Lambda origin (SSR)
- Lambda function wrapping OpenNext build output
- S3 bucket for static assets (separate from audio S3 bucket)
- CloudFront cache behaviors
- Custom domain binding (Route53 + ACM)
- Secrets injection from SSM Parameter Store into Lambda env vars

### OpenNext
Adapts the Next.js App Router build for Lambda:
- SSR pages and API routes → Lambda function
- Static assets (`/_next/static/*`, public files) → S3
- Middleware (`auth.config.ts`) → CloudFront Functions (Edge-compatible, already split)

### Secrets (SSM Parameter Store)
All environment variables move from Vercel Dashboard to AWS SSM Parameter Store, managed via `sst secret set`. Lambda receives them as environment variables at deploy time.

| Secret | Description |
|---|---|
| `AUTH_SECRET` | NextAuth signing secret |
| `AUTH_EMAIL_FROM` | SES sender address |
| `AUTH_URL` | `https://patchlib.app` |
| `DATABASE_URL` | Aurora Data API connection string |
| `AUDIO_BUCKET_NAME` | S3 bucket for audio files |
| `AUDIO_AWS_REGION` | AWS region |
| `AUDIO_AWS_ACCESS_KEY_ID` | IAM key for S3 uploads |
| `AUDIO_AWS_SECRET_ACCESS_KEY` | IAM secret for S3 uploads |

### Route53 + ACM
- Hosted zone for `patchlib.app` ($0.50/month)
- ACM certificate in `us-east-1` (required for CloudFront) — free
- CloudFront alias record pointing to distribution

---

## Database Connection Change

The only code change at the application layer is how Prisma connects to Aurora.

**Current:** Direct TCP connection string  
```
DATABASE_URL=postgresql://user:pass@aurora-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/patchlib
```

**After:** RDS Data API via Prisma adapter  
```
DATABASE_URL=postgresql://user:pass@aurora-cluster.cluster-xxx.us-east-1.rds.amazonaws.com:5432/patchlib
```
Plus adding `@prisma/adapter-aurora-data-api` and enabling the Data API on the Aurora cluster in AWS Console.

Prisma client instantiation changes from:
```typescript
new PrismaClient()
```
to:
```typescript
import { RDSDataClient } from '@aws-sdk/client-rds-data'
import { PrismaAuroraDataAPI } from '@prisma/adapter-aurora-data-api'

const client = new RDSDataClient({ region: 'us-east-1' })
const adapter = new PrismaAuroraDataAPI(client, { resourceArn, secretArn, database })
new PrismaClient({ adapter })
```

---

## CI/CD Pipeline

**File:** `.github/workflows/deploy.yml`

```
Trigger: push to main

Steps:
1. Checkout
2. Setup Node.js
3. npm ci
4. npm test  (must pass before deploy)
5. sst deploy --stage production
```

**GitHub Secrets required:**
- `AWS_ACCESS_KEY_ID` — IAM user with deploy permissions
- `AWS_SECRET_ACCESS_KEY` — IAM secret

**IAM permissions for deploy user:**
- `cloudfront:*`, `lambda:*`, `s3:*`, `iam:*` (SST creates roles)
- `rds-data:*` (Data API)
- `ssm:GetParameter`, `ssm:PutParameter`
- `route53:*`, `acm:*`
- `cloudformation:*` (Pulumi uses CloudFormation under the hood)

In practice: attach `AdministratorAccess` for the deploy user and scope it down after first successful deploy.

No preview deployments. Only `main` → production.

---

## Migration Steps (high level)

1. Enable RDS Data API on Aurora cluster
2. Add `sst.config.ts` + OpenNext config
3. Update Prisma client to use Data API adapter
4. Set SST secrets (migrate from Vercel env vars)
5. Configure Route53 hosted zone + ACM certificate
6. Run `sst deploy --stage production` locally first to validate
7. Add GitHub Actions workflow
8. Cut DNS over from Vercel to CloudFront
9. Remove Vercel project

---

## Cost Summary

| Component | Cost/Month |
|---|---|
| Lambda (SSR + API) | ~$0 (Free Tier covers personal use) |
| CloudFront | ~$0 (Free Tier: 1TB transfer) |
| S3 static assets | ~$0.01 |
| S3 audio (existing) | ~$0.50 |
| Aurora Serverless v2 (existing) | ~$2–5 |
| SES (existing) | ~$0 |
| Route53 hosted zone | $0.50 |
| ACM certificate | $0 |
| **Total** | **~$3–6/month** |

Delta vs. current: **+$0.50/month** (Route53 hosted zone only).

---

## What Does NOT Change

- Aurora Serverless v2 cluster (same cluster, same data)
- S3 bucket for audio files
- SES configuration and sender domain
- Auth.js v5 split config (already Edge-compatible via `auth.config.ts`)
- All application code except Prisma client instantiation
- Domain `patchlib.app`
