import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clear existing data
  await prisma.cableConnection.deleteMany()
  await prisma.knobSetting.deleteMany()
  await prisma.patch.deleteMany()

  const heavyKick = await prisma.patch.create({
    data: {
      name: 'Heavy Kick',
      device: 'DFAM',
      description: 'Deep punchy kick drum with short, snappy envelope',
      tags: ['percussion', 'kick'],
      knobSettings: {
        create: [
          { knobId: 'tempo',        value: 7.2 },
          { knobId: 'vco1_freq',    value: 3.0 },
          { knobId: 'vco1_level',   value: 9.0 },
          { knobId: 'vca_decay',    value: 8.1 },
          { knobId: 'vcf_cutoff',   value: 4.5 },
          { knobId: 'vcf_resonance',value: 2.0 },
        ],
      },
      connections: {
        create: [
          { fromJack: 'vco1_out', toJack: 'vco1_cv',       color: 'orange' },
          { fromJack: 'vca_out',  toJack: 'vcf_cutoff_in', color: 'blue'   },
        ],
      },
    },
  })

  const acidLoop = await prisma.patch.create({
    data: {
      name: 'Acid Loop',
      device: 'DFAM',
      description: 'Squelchy 303-style acid bassline — turn up VCF resonance',
      tags: ['bass', 'acid'],
      knobSettings: {
        create: [
          { knobId: 'tempo',          value: 5.0 },
          { knobId: 'vco1_freq',      value: 6.5 },
          { knobId: 'vcf_cutoff',     value: 8.0 },
          { knobId: 'vcf_resonance',  value: 7.0 },
          { knobId: 'vcf_decay',      value: 3.5 },
          { knobId: 'vco1_fm_amount', value: 0.5 },
        ],
      },
      connections: {
        create: [
          { fromJack: 'vco2_out',    toJack: 'vco1_fm',       color: 'orange' },
          { fromJack: 'vca_out',     toJack: 'vcf_cutoff_in', color: 'blue'   },
          { fromJack: 'trigger_out', toJack: 'adv_clock',     color: 'green'  },
        ],
      },
    },
  })

  const darkDrone = await prisma.patch.create({
    data: {
      name: 'Dark Drone',
      device: 'DFAM',
      description: 'Slow evolving ambient texture — slow tempo, long decay',
      tags: ['drone', 'ambient'],
      sequenceNotes: 'Set all 8 steps to the same pitch for a static tone. Slowly open VCF cutoff over time.',
      knobSettings: {
        create: [
          { knobId: 'tempo',       value: 2.0 },
          { knobId: 'vco1_freq',   value: 1.2 },
          { knobId: 'vco2_freq',   value: 1.8 },
          { knobId: 'vco_decay',   value: 9.5 },
          { knobId: 'vca_decay',   value: 9.0 },
          { knobId: 'vcf_cutoff',  value: 3.0 },
        ],
      },
      connections: {
        create: [
          { fromJack: 'vco1_out', toJack: 'vco1_cv', color: 'orange' },
          { fromJack: 'vco2_out', toJack: 'vco1_fm', color: 'blue'   },
        ],
      },
    },
  })

  console.log('Seeded:', heavyKick.name, '/', acidLoop.name, '/', darkDrone.name)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
