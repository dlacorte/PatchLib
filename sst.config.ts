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
    // Existing S3 bucket — managed outside SST (created with the app)
    const audioBucketName = new sst.Secret("AudioBucketName");

    const isProd = $app.stage === "production";

    const site = new sst.aws.Nextjs("PatchLib", {
      // Run prisma generate before open-next build (which calls next build internally)
      buildCommand: "npx prisma generate && npx open-next@3.5.4 build",
      openNextVersion: "3.5.4",
      environment: {
        AUTH_SECRET: authSecret.value,
        AUTH_URL: isProd ? "https://patchlib.app" : undefined,
        AUTH_EMAIL_FROM: authEmailFrom.value,
        DATABASE_URL: databaseUrl.value,
        AUDIO_BUCKET_NAME: audioBucketName.value,
      },
      permissions: [
        {
          actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
          resources: ["arn:aws:s3:::*"],
        },
        {
          actions: ["ses:SendEmail", "ses:SendRawEmail"],
          resources: ["*"],
        },
      ],
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
