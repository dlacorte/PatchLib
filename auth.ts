import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Email from 'next-auth/providers/email'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { prisma } from '@/lib/prisma'

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'us-east-1' })

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      from: process.env.AUTH_EMAIL_FROM!,
      sendVerificationRequest: async ({ identifier: email, url }) => {
        await ses.send(
          new SendEmailCommand({
            Source: process.env.AUTH_EMAIL_FROM!,
            Destination: { ToAddresses: [email] },
            Message: {
              Subject: { Data: 'Sign in to PatchLib' },
              Body: {
                Html: {
                  Data: `<p>Click the link below to sign in to PatchLib:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
                },
                Text: {
                  Data: `Sign in to PatchLib: ${url}\n\nThis link expires in 24 hours.`,
                },
              },
            },
          }),
        )
      },
    }),
  ],
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
})
