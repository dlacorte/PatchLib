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
    const databaseUrl = new sst.Secret("DatabaseUrl");
    // Existing S3 bucket — managed outside SST (created with the app)
    const audioBucketName = new sst.Secret("AudioBucketName");

    const isProd = $app.stage === "production";

    const site = new sst.aws.Nextjs("PatchLib", {
      // SST auto-detects @opennextjs/aws@3.6.6 for Next.js 14.
      // OpenNext calls `npm run build` internally → prisma generate runs automatically.
      environment: {
        AUTH_SECRET: authSecret.value,
        AUTH_URL: isProd ? "https://patchlib.com" : undefined,
        DATABASE_URL: databaseUrl.value,
        AUDIO_BUCKET_NAME: audioBucketName.value,
      },
      permissions: [
        {
          actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
          resources: ["arn:aws:s3:::*"],
        },
      ],
      domain: isProd
        ? {
            name: "patchlib.com",
            // DNS stays at INWX (same pattern as daniellacorte.de).
            // ACM cert validated via CNAME at INWX, no Route53 needed.
            cert: "arn:aws:acm:us-east-1:317447425242:certificate/ed91190f-4e94-42cf-b17f-d316a1d9eb4e",
            dns: false,
          }
        : undefined,
    });

    return {
      url: site.url,
    };
  },
});
