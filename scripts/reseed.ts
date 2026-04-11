import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { prefixJackId } from '../lib/devices'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'daniel.la-corte@proton.me' } })
  if (!user) throw new Error('User not found')

  await prisma.patch.deleteMany({ where: { userId: user.id } })
  console.log('Deleted existing patches')

  const dfam = (j: string) => prefixJackId('DFAM', j)

  await prisma.patch.create({
    data: {
      name: 'Deep Kick',
      devices: ['DFAM'],
      description: 'Classic 808-style kick drum. Long pitch envelope creates deep thump. Velocity routed to VCA for dynamic hits.',
      tags: ['kick', 'bass', 'drum', '808'],
      isPublic: false,
      userId: user.id,
      sequenceNotes: 'Tempo ~5.5. Steps 1+5 at full velocity. Remaining steps low velocity for ghost hits.',
      knobSettings: {
        create: [
          { device: 'DFAM', knobId: 'vco_decay',       value: 8.0 },
          { device: 'DFAM', knobId: 'seq_pitch_mod',   value: 0   },
          { device: 'DFAM', knobId: 'vco1_eg_amount',  value: 9.0 },
          { device: 'DFAM', knobId: 'vco1_freq',       value: 1.5 },
          { device: 'DFAM', knobId: 'fm_1_2_amount',   value: 1.5 },
          { device: 'DFAM', knobId: 'hard_sync',       value: 0   },
          { device: 'DFAM', knobId: 'vco2_eg_amount',  value: 6.0 },
          { device: 'DFAM', knobId: 'vco2_freq',       value: 1.5 },
          { device: 'DFAM', knobId: 'vco1_wave',       value: 0   },
          { device: 'DFAM', knobId: 'vco1_level',      value: 8.5 },
          { device: 'DFAM', knobId: 'noise_ext_level', value: 1.0 },
          { device: 'DFAM', knobId: 'vco2_wave',       value: 0   },
          { device: 'DFAM', knobId: 'vco2_level',      value: 7.0 },
          { device: 'DFAM', knobId: 'vcf_mode',        value: 1   },
          { device: 'DFAM', knobId: 'vcf_cutoff',      value: 5.5 },
          { device: 'DFAM', knobId: 'vcf_resonance',   value: 2.0 },
          { device: 'DFAM', knobId: 'vcf_decay',       value: 5.0 },
          { device: 'DFAM', knobId: 'vcf_eg_amount',   value: 3.0 },
          { device: 'DFAM', knobId: 'vca_eg',          value: 0   },
          { device: 'DFAM', knobId: 'volume',          value: 8.0 },
          { device: 'DFAM', knobId: 'noise_vcf_mod',   value: 0   },
          { device: 'DFAM', knobId: 'vca_decay',       value: 6.5 },
          { device: 'DFAM', knobId: 'tempo',           value: 5.5 },
          { device: 'DFAM', knobId: 'seq_1_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_1_vel', value: 10.0 },
          { device: 'DFAM', knobId: 'seq_2_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_2_vel', value: 2.0  },
          { device: 'DFAM', knobId: 'seq_3_pitch', value: 2.5 }, { device: 'DFAM', knobId: 'seq_3_vel', value: 3.5  },
          { device: 'DFAM', knobId: 'seq_4_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_4_vel', value: 2.0  },
          { device: 'DFAM', knobId: 'seq_5_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_5_vel', value: 10.0 },
          { device: 'DFAM', knobId: 'seq_6_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_6_vel', value: 2.0  },
          { device: 'DFAM', knobId: 'seq_7_pitch', value: 2.5 }, { device: 'DFAM', knobId: 'seq_7_vel', value: 3.0  },
          { device: 'DFAM', knobId: 'seq_8_pitch', value: 2.0 }, { device: 'DFAM', knobId: 'seq_8_vel', value: 2.0  },
        ],
      },
      connections: {
        create: [
          { fromJack: dfam('velocity_cv_out'), toJack: dfam('vca_cv_in'),   color: 'orange' },
          { fromJack: dfam('velocity_cv_out'), toJack: dfam('vco1_cv_in'),  color: 'blue'   },
          { fromJack: dfam('pitch_out'),       toJack: dfam('vco2_cv_in'),  color: 'green'  },
        ],
      },
    },
  })
  console.log('Created: Deep Kick')
}

main().catch(console.error).finally(() => prisma.$disconnect())
