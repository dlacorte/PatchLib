import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

let prismaInstance: PrismaClient

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient()
} catch (err: unknown) {
  // If Prisma client initialization fails (e.g., during build), create a stub
  // This allows the build to succeed even without a valid database
  const errMessage = err instanceof Error ? err.message : 'Unknown error'
  console.warn('Prisma client initialization failed, using stub:', errMessage)
  prismaInstance = new Proxy({} as PrismaClient, {
    get: () => {
      throw new Error('Prisma client is not available. Ensure DATABASE_URL is set and valid.')
    },
  }) as PrismaClient
}

export const prisma = prismaInstance

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance
