import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({ include: { patches: { select: { id: true, name: true } } } })
  for (const u of users) {
    console.log(`${u.email} (${u.id}) — ${u.patches.length} patches: ${u.patches.map(p => p.name).join(', ')}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
