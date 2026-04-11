import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'daniel.la-corte@proton.me' } })
  if (!user) throw new Error('User not found')

  await prisma.patch.deleteMany({ where: { userId: user.id } })
  console.log('Deleted existing patches')

  await prisma.patch.create({
    data: {
      name: 'Deep Kick',
      device: 'DFAM',
      description: 'Classic 808-style kick drum. Long pitch envelope creates deep thump. VCO 2 adds low sub layer. Velocity routed to VCA for dynamic hits.',
      tags: ['kick', 'bass', 'drum', '808'],
      isPublic: false,
      userId: user.id,
      sequenceNotes: 'Tempo ~5.5. Steps 1+5 at full velocity for kick on beats 1 and 3. Remaining steps at low velocity for ghost hits.',
      knobSettings: {
        create: [
          // VCO / Pitch / FM
          { knobId: 'vco_decay',       value: 8.0 },
          { knobId: 'seq_pitch_mod',   value: 0   },
          { knobId: 'vco1_eg_amount',  value: 9.0 },
          { knobId: 'vco1_freq',       value: 1.5 },
          { knobId: 'fm_1_2_amount',   value: 1.5 },
          { knobId: 'hard_sync',       value: 0   },
          { knobId: 'vco2_eg_amount',  value: 6.0 },
          { knobId: 'vco2_freq',       value: 1.5 },
          // Wave / Mixer
          { knobId: 'vco1_wave',       value: 0   },
          { knobId: 'vco1_level',      value: 8.5 },
          { knobId: 'noise_ext_level', value: 1.0 },
          { knobId: 'vco2_wave',       value: 0   },
          { knobId: 'vco2_level',      value: 7.0 },
          // Filter
          { knobId: 'vcf_mode',        value: 1   },
          { knobId: 'vcf_cutoff',      value: 5.5 },
          { knobId: 'vcf_resonance',   value: 2.0 },
          { knobId: 'vcf_decay',       value: 5.0 },
          { knobId: 'vcf_eg_amount',   value: 3.0 },
          // VCA / Output
          { knobId: 'vca_eg',          value: 0   },
          { knobId: 'volume',          value: 8.0 },
          { knobId: 'noise_vcf_mod',   value: 0   },
          { knobId: 'vca_decay',       value: 6.5 },
          // Sequencer
          { knobId: 'tempo',           value: 5.5 },
          { knobId: 'seq_1_pitch', value: 2.0 }, { knobId: 'seq_1_vel', value: 10.0 },
          { knobId: 'seq_2_pitch', value: 2.0 }, { knobId: 'seq_2_vel', value: 2.0  },
          { knobId: 'seq_3_pitch', value: 2.5 }, { knobId: 'seq_3_vel', value: 3.5  },
          { knobId: 'seq_4_pitch', value: 2.0 }, { knobId: 'seq_4_vel', value: 2.0  },
          { knobId: 'seq_5_pitch', value: 2.0 }, { knobId: 'seq_5_vel', value: 10.0 },
          { knobId: 'seq_6_pitch', value: 2.0 }, { knobId: 'seq_6_vel', value: 2.0  },
          { knobId: 'seq_7_pitch', value: 2.5 }, { knobId: 'seq_7_vel', value: 3.0  },
          { knobId: 'seq_8_pitch', value: 2.0 }, { knobId: 'seq_8_vel', value: 2.0  },
        ],
      },
      connections: {
        create: [
          { fromJack: 'velocity_cv_out', toJack: 'vca_cv_in',   color: 'orange' },
          { fromJack: 'velocity_cv_out', toJack: 'vco1_cv_in',  color: 'blue'   },
          { fromJack: 'pitch_out',       toJack: 'vco2_cv_in',  color: 'green'  },
        ],
      },
    },
  })
  console.log('Created: Deep Kick')
}

main().catch(console.error).finally(() => prisma.$disconnect())
