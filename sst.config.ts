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
