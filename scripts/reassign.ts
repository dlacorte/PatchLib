import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  const target = await prisma.user.findUnique({ where: { email: 'daniel.la-corte@proton.me' } })
  if (!target) throw new Error('Target user not found')

  const updated = await prisma.patch.updateMany({
    where: { user: { email: 'demo@patchlib.com' } },
    data: { userId: target.id },
  })
  console.log(`Moved ${updated.count} patches to ${target.email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
