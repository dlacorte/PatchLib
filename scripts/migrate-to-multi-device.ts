import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Backfill Patch.devices from Patch.device
  const patches = await prisma.patch.findMany({ select: { id: true, device: true, devices: true } })
  let patchesUpdated = 0
  for (const p of patches) {
    if (p.devices.length === 0) {
      await prisma.patch.update({
        where: { id: p.id },
        // @ts-ignore — device still exists at this migration step
        data: { devices: [p.device ?? 'DFAM'] },
      })
      patchesUpdated++
    }
  }
  console.log(`Backfilled devices on ${patchesUpdated} patches`)

  // 2. Prefix CableConnection jack IDs
  const conns = await prisma.cableConnection.findMany()
  let connsUpdated = 0
  for (const c of conns) {
    const needsPrefix = !c.fromJack.includes(':')
    if (needsPrefix) {
      await prisma.cableConnection.update({
        where: { id: c.id },
        data: {
          fromJack: `dfam:${c.fromJack}`,
          toJack: `dfam:${c.toJack}`,
        },
      })
      connsUpdated++
    }
  }
  console.log(`Prefixed jack IDs on ${connsUpdated} connections`)

  // 3. Verify KnobSetting.device (should all be 'DFAM' via default)
  const knobsWithoutDevice = await prisma.knobSetting.count({ where: { device: { not: 'DFAM' } } })
  console.log(`KnobSettings with non-DFAM device: ${knobsWithoutDevice} (expected 0)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
