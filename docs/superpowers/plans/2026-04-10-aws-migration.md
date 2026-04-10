# AWS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate PatchLib hosting from Vercel to AWS (Lambda + CloudFront via SST Ion), keeping Aurora, S3, and SES unchanged.

**Architecture:** SST Ion (v3) deploys Next.js via OpenNext to Lambda + CloudFront + S3 (static). Lambda connects to Aurora directly over SSL — Aurora is made publicly accessible (no VPC/NAT required). GitHub Actions triggers `sst deploy --stage production` on every push to `main`.

**Tech Stack:** SST Ion v3, OpenNext, AWS Lambda, CloudFront, S3, Route53, ACM, GitHub Actions

> **Spec deviation note:** The design spec referenced `@prisma/adapter-aurora-data-api` which has no official Prisma implementation. Instead: enable public access on Aurora and keep existing `@prisma/adapter-pg`. Identical cost profile ($0 extra), zero Prisma code changes.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `sst.config.ts` | Create | SST Ion infra — Lambda, CloudFront, domain, secrets |
| `.github/workflows/deploy.yml` | Create | CI/CD — test + deploy on push to main |
| `package.json` | Modify | Add `sst` dep, add `open-next.config.ts` awareness |
| `.gitignore` | Modify | Add `.sst/` |
| `next.config.mjs` | Modify | Remove empty `experimental` block (OpenNext compat) |
| `vercel.json` | Delete | Replaced by `sst.config.ts` |
| `lib/prisma.ts` | No change | PrismaPg adapter stays, Aurora goes public |

---

## Task 1: Enable Aurora Public Access (AWS Console)

**Files:** None — manual AWS Console steps.

> Aurora is currently in a VPC without public access. Lambda outside VPC needs TCP access. This task makes the cluster reachable from the internet over SSL.

- [ ] **Step 1: Open Aurora in AWS Console**

  Navigate to: RDS → Databases → select the PatchLib Aurora cluster → **Modify**

- [ ] **Step 2: Enable public accessibility**

  Under "Connectivity":
  - Set **Publicly accessible** → `Yes`
  - Click **Continue** → **Apply immediately** → **Modify cluster**

- [ ] **Step 3: Update security group**

  Navigate to: RDS → Databases → PatchLib cluster → **Connectivity & security** tab → click the security group link.

  Add inbound rule:
  - Type: `PostgreSQL`
  - Port: `5432`
  - Source: `0.0.0.0/0`
  - Description: `Lambda public access (SSL required)`

- [ ] **Step 4: Verify connection from local machine**

  Run from your terminal (replace with your actual Aurora endpoint and credentials):

  ```bash
  psql "postgresql://USER:PASS@YOUR-CLUSTER.cluster-xxx.us-east-1.rds.amazonaws.com:5432/patchlib?sslmode=require"
  ```

  Expected: PostgreSQL prompt. If you connect, Lambda will too.

- [ ] **Step 5: Commit note**

  ```bash
  git commit --allow-empty -m "chore: aurora public access enabled (manual AWS Console step)"
  ```

---

## Task 2: Install SST Ion and Scaffold Config

**Files:**
- Create: `sst.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `next.config.mjs`
- Delete: `vercel.json`

- [ ] **Step 1: Install SST Ion**

  ```bash
  npm install sst@^3 --save-dev --legacy-peer-deps
  ```

  Expected: `sst` appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Add `.sst/` to .gitignore**

  Add to `.gitignore` after the `# vercel` block:

  ```
  # sst
  .sst/
  ```

- [ ] **Step 3: Clean up `next.config.mjs` for OpenNext compatibility**

  Replace the file content:

  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    typescript: {
      ignoreBuildErrors: false,
    },
  };

  export default nextConfig;
  ```

- [ ] **Step 4: Create `sst.config.ts`**

  ```typescript
  /// <reference path="./.sst/platform/config.d.ts" />

  export default $config({
    app(input) {
      return {
        name: "patchlib",
        removal: input?.stage === "production" ? "retain" : "remove",
        home: "aws",
        providers: {
          aws: { region: "us-east-1" },
        },
      };
    },
    async run() {
      // Secrets — set with: npx sst secret set <Name> <value> --stage production
      const authSecret = new sst.Secret("AuthSecret");
      const authEmailFrom = new sst.Secret("AuthEmailFrom");
      const databaseUrl = new sst.Secret("DatabaseUrl");
      const audioBucketName = new sst.Secret("AudioBucketName");
      const audioAwsRegion = new sst.Secret("AudioAwsRegion");
      const audioAwsAccessKeyId = new sst.Secret("AudioAwsAccessKeyId");
      const audioAwsSecretAccessKey = new sst.Secret("AudioAwsSecretAccessKey");

      const isProd = $app.stage === "production";

      const site = new sst.aws.Nextjs("PatchLib", {
        environment: {
          AUTH_SECRET: authSecret.value,
          AUTH_URL: isProd ? "https://patchlib.app" : "",
          AUTH_EMAIL_FROM: authEmailFrom.value,
          DATABASE_URL: databaseUrl.value,
          AUDIO_BUCKET_NAME: audioBucketName.value,
          AUDIO_AWS_REGION: audioAwsRegion.value,
          AUDIO_AWS_ACCESS_KEY_ID: audioAwsAccessKeyId.value,
          AUDIO_AWS_SECRET_ACCESS_KEY: audioAwsSecretAccessKey.value,
        },
        domain: isProd
          ? {
              name: "patchlib.app",
              dns: sst.aws.dns(),
            }
          : undefined,
      });

      return {
        url: site.url,
      };
    },
  });
  ```

- [ ] **Step 5: Delete `vercel.json`**

  ```bash
  rm vercel.json
  ```

- [ ] **Step 6: Verify TypeScript compiles**

  ```bash
  npx tsc --noEmit
  ```

  Expected: no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add sst.config.ts .gitignore next.config.mjs package.json package-lock.json
  git rm vercel.json
  git commit -m "feat: add SST Ion config, remove vercel.json"
  ```

---

## Task 3: Migrate Secrets from Vercel to SST

**Files:** None — CLI commands only.

> All env vars currently in Vercel Dashboard move to SST Secrets (stored in AWS SSM Parameter Store). Run these commands with your actual values from Vercel.

- [ ] **Step 1: Retrieve current values from Vercel**

  ```bash
  vercel env pull .env.vercel --environment=production
  cat .env.vercel
  ```

  Note the values for: `AUTH_SECRET`, `AUTH_EMAIL_FROM`, `DATABASE_URL`, `AUDIO_BUCKET_NAME`, `AUDIO_AWS_REGION`, `AUDIO_AWS_ACCESS_KEY_ID`, `AUDIO_AWS_SECRET_ACCESS_KEY`.

- [ ] **Step 2: Set each secret for production stage**

  Run each command, substituting the actual value:

  ```bash
  npx sst secret set AuthSecret "VALUE" --stage production
  npx sst secret set AuthEmailFrom "VALUE" --stage production
  npx sst secret set DatabaseUrl "VALUE" --stage production
  npx sst secret set AudioBucketName "VALUE" --stage production
  npx sst secret set AudioAwsRegion "VALUE" --stage production
  npx sst secret set AudioAwsAccessKeyId "VALUE" --stage production
  npx sst secret set AudioAwsSecretAccessKey "VALUE" --stage production
  ```

  Expected: each command prints `✓ Set AuthSecret for stage production`.

- [ ] **Step 3: Verify secrets are stored**

  ```bash
  npx sst secret list --stage production
  ```

  Expected: all 7 secrets listed.

- [ ] **Step 4: Remove the pulled env file**

  ```bash
  rm .env.vercel
  ```

---

## Task 4: First Deploy to Staging

**Files:** None — deploy commands only.

> Deploy to a `staging` stage first (no custom domain, gets a random CloudFront URL). This validates the full stack before touching DNS.

- [ ] **Step 1: Set secrets for staging stage**

  ```bash
  npx sst secret set AuthSecret "VALUE" --stage staging
  npx sst secret set AuthEmailFrom "VALUE" --stage staging
  npx sst secret set DatabaseUrl "VALUE" --stage staging
  npx sst secret set AudioBucketName "VALUE" --stage staging
  npx sst secret set AudioAwsRegion "VALUE" --stage staging
  npx sst secret set AudioAwsAccessKeyId "VALUE" --stage staging
  npx sst secret set AudioAwsSecretAccessKey "VALUE" --stage staging
  ```

- [ ] **Step 2: Run tests before deploying**

  ```bash
  npm test
  ```

  Expected: all 94 tests pass.

- [ ] **Step 3: Deploy to staging**

  ```bash
  npx sst deploy --stage staging
  ```

  Expected output (after several minutes):
  ```
  ✓  Complete
     PatchLib: https://xxxx.cloudfront.net
  ```

  Note the CloudFront URL.

- [ ] **Step 4: Smoke test the staging URL**

  Open the CloudFront URL in a browser. Verify:
  - Homepage loads with patch list
  - `/login` page renders
  - Magic link form is present
  - `/patches/[id]` page loads for a public patch
  - Navigation shows "Sign in" for guests

- [ ] **Step 5: Test auth flow on staging**

  On the staging URL:
  - Enter your email on `/login`
  - Check your inbox for the magic link email
  - Click the link — should redirect to `/library`

  If the email arrives and login works: auth is fully functional on Lambda.

---

## Task 5: Set Up GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflows directory**

  ```bash
  mkdir -p .github/workflows
  ```

- [ ] **Step 2: Create the deploy workflow**

  Create `.github/workflows/deploy.yml`:

  ```yaml
  name: Deploy to Production

  on:
    push:
      branches:
        - main

  jobs:
    deploy:
      runs-on: ubuntu-latest
      timeout-minutes: 30

      steps:
        - name: Checkout
          uses: actions/checkout@v4

        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci --legacy-peer-deps

        - name: Run tests
          run: npm test

        - name: Deploy to production
          run: npx sst deploy --stage production
          env:
            AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
            AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  ```

- [ ] **Step 3: Create IAM user for GitHub Actions in AWS Console**

  Navigate to: IAM → Users → **Create user**
  - Username: `patchlib-github-actions`
  - Attach policy: `AdministratorAccess` (scope down later)
  - Create access key → Application running outside AWS
  - Save the `Access key ID` and `Secret access key`

- [ ] **Step 4: Add AWS credentials to GitHub Secrets**

  Navigate to: GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**

  Add two secrets:
  - `AWS_ACCESS_KEY_ID` — the access key ID from Step 3
  - `AWS_SECRET_ACCESS_KEY` — the secret key from Step 3

- [ ] **Step 5: Commit the workflow**

  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "feat: add GitHub Actions deploy workflow (main → production)"
  ```

- [ ] **Step 6: Push and verify the action runs**

  ```bash
  git push origin main
  ```

  Navigate to: GitHub repo → Actions tab. Verify the workflow starts, tests pass, and deploy completes.

  Expected: green checkmark, production CloudFront URL in deploy output.

---

## Task 6: Configure Route53 and ACM Certificate

**Files:** None — manual AWS Console steps.

> This task sets up the domain `patchlib.app` in Route53 and issues a TLS certificate via ACM. Both are required before adding the custom domain to CloudFront.

- [ ] **Step 1: Create Route53 hosted zone**

  Navigate to: Route53 → Hosted zones → **Create hosted zone**
  - Domain name: `patchlib.app`
  - Type: Public hosted zone
  - Click **Create hosted zone**

  Note the 4 nameservers assigned (e.g. `ns-123.awsdns-45.com`).

- [ ] **Step 2: Update nameservers at your domain registrar**

  Log in to wherever `patchlib.app` is registered. Replace the current nameservers with the 4 Route53 nameservers from Step 1.

  DNS propagation takes 15 min – 48 hours. Continue to next step while waiting — ACM validation needs DNS to propagate.

- [ ] **Step 3: Request ACM certificate**

  Navigate to: ACM (Certificate Manager) → **must be in `us-east-1` region** (required for CloudFront) → **Request a certificate**
  - Certificate type: Public
  - Domain names: `patchlib.app` and `*.patchlib.app`
  - Validation method: DNS validation
  - Click **Request**

- [ ] **Step 4: Add ACM CNAME validation records to Route53**

  In ACM, click the certificate → expand domain → click **Create records in Route53**.

  AWS will automatically add the CNAME records to your hosted zone. Wait for certificate status to change to `Issued` (usually 5–30 minutes after DNS has propagated).

- [ ] **Step 5: Verify certificate is issued**

  In ACM, the certificate status should show **Issued**.

  No commit needed — this task is all manual.

---

## Task 7: Production Deploy with Custom Domain + DNS Cutover

**Files:** None — deploy commands + DNS update.

> With Route53 and ACM ready, redeploy production with the custom domain wired up. Then cut DNS over from Vercel to CloudFront.

- [ ] **Step 1: Verify ACM certificate status**

  ```bash
  aws acm list-certificates --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='patchlib.app']"
  ```

  Expected: `"Status": "ISSUED"`. Do not proceed until this shows `ISSUED`.

- [ ] **Step 2: Deploy production with custom domain**

  `sst.config.ts` already has the domain config for `isProd`. Run:

  ```bash
  npx sst deploy --stage production
  ```

  SST will:
  - Create/update CloudFront distribution with `patchlib.app` alias
  - Attach the ACM certificate
  - Create Route53 A/AAAA alias records pointing to CloudFront

  Expected output:
  ```
  ✓  Complete
     PatchLib: https://patchlib.app
  ```

- [ ] **Step 3: Verify the site loads on the custom domain**

  Open `https://patchlib.app` in a browser. Verify:
  - HTTPS certificate is valid (no browser warning)
  - Homepage loads
  - Login works end-to-end (magic link email → session)

- [ ] **Step 4: Remove the Vercel project**

  Once `https://patchlib.app` is confirmed working on AWS:

  ```bash
  vercel remove patchlib --yes
  ```

  Expected: `Success! Project patchlib removed.`

- [ ] **Step 5: Final commit**

  ```bash
  git commit --allow-empty -m "chore: production deployed to AWS, Vercel project removed"
  ```

---

## Task 8: Post-Migration Cleanup

**Files:**
- Modify: `package.json` — remove unused Vercel build script remnant
- Modify: `README.md` — update deployment section

- [ ] **Step 1: Update `package.json` build script**

  The `build` script currently runs `prisma generate && next build` (set for Vercel). SST Ion runs `next build` itself — but `prisma generate` still needs to run. Verify the build script is still correct:

  Open `package.json`. The build script should read:

  ```json
  "build": "prisma generate && next build"
  ```

  SST Ion calls `npm run build` internally, so this is correct. No change needed.

- [ ] **Step 2: Remove `.vercel` from `.gitignore` (optional cleanup)**

  In `.gitignore`, the `# vercel` section can stay — it doesn't hurt anything. Skip if not needed.

- [ ] **Step 3: Update README deployment section**

  In `README.md`, replace the deployment tech stack row:

  Find:
  ```markdown
  | Deployment | Vercel |
  ```

  Replace with:
  ```markdown
  | Deployment | AWS (Lambda + CloudFront via SST Ion) |
  | CI/CD | GitHub Actions |
  ```

- [ ] **Step 4: Commit cleanup**

  ```bash
  git add README.md
  git commit -m "docs: update README — deployment is now AWS via SST Ion"
  git push origin main
  ```

  Expected: GitHub Actions triggers, deploys successfully, site remains live on `https://patchlib.app`.
