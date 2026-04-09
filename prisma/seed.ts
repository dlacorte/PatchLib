import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.cableConnection.deleteMany()
  await prisma.knobSetting.deleteMany()
  await prisma.patch.deleteMany()

  // ── PATCH 1: Heavy Kick ───────────────────────────────────────────────────
  // Classic punchy kick. VCO1 low + triangle, fast pitch drop via EG,
  // short filter + VCA envelope, trigger routed to VCA CV for extra punch.
  const heavyKick = await prisma.patch.create({
    data: {
      name: 'Heavy Kick',
      device: 'DFAM',
      description: 'Deep punchy kick with fast pitch sweep and tight VCA decay. VCO1 in triangle, pitch drops via EG on hit.',
      tags: ['kick', 'percussion', 'drums'],
      sequenceNotes: 'Step 1 at full pitch and velocity for the downbeat. Steps 2–8 at lower pitch values to shape the groove. Keep VCO DECAY short for punchy attack.',
      knobSettings: {
        create: [
          // Pitch / FM / Sync
          { knobId: 'vco_decay',      value: 2.0 },  // short pitch decay = thud
          { knobId: 'seq_pitch_mod',  value: 1   },  // SEQ → VCO1
          { knobId: 'vco1_eg_amount', value: 7.0 },  // large downward pitch sweep
          { knobId: 'vco1_freq',      value: 2.5 },  // low fundamental
          { knobId: 'fm_1_2_amount',  value: 0.0 },
          { knobId: 'vco2_eg_amount', value: 0.0 },
          { knobId: 'vco2_freq',      value: 3.0 },
          // Wave / Mixer
          { knobId: 'vco1_wave',      value: 0   },  // TRI — smooth body
          { knobId: 'vco1_level',     value: 9.5 },
          { knobId: 'noise_ext_level',value: 0.5 },  // tiny noise click
          { knobId: 'vco2_wave',      value: 0   },  // TRI
          { knobId: 'vco2_level',     value: 3.0 },
          // Filter
          { knobId: 'vcf_mode',       value: 1   },  // LP
          { knobId: 'vcf_cutoff',     value: 5.5 },
          { knobId: 'vcf_resonance',  value: 1.5 },
          { knobId: 'vcf_decay',      value: 2.5 },
          { knobId: 'vcf_eg_amount',  value: 3.0 },
          // Mod / VCA
          { knobId: 'vca_eg',         value: 0   },  // FAST
          { knobId: 'volume',         value: 8.5 },
          { knobId: 'noise_vcf_mod',  value: 0.0 },
          { knobId: 'vca_decay',      value: 5.5 },
          // Sequencer
          { knobId: 'tempo',          value: 7.5 },
          // Step pitches (step 1 = high, walk down for groove)
          { knobId: 'seq_1_pitch',    value: 9.0 },
          { knobId: 'seq_1_vel',      value: 10  },
          { knobId: 'seq_2_pitch',    value: 2.0 },
          { knobId: 'seq_2_vel',      value: 5.0 },
          { knobId: 'seq_3_pitch',    value: 2.0 },
          { knobId: 'seq_3_vel',      value: 6.0 },
          { knobId: 'seq_4_pitch',    value: 2.5 },
          { knobId: 'seq_4_vel',      value: 7.0 },
          { knobId: 'seq_5_pitch',    value: 9.0 },
          { knobId: 'seq_5_vel',      value: 9.0 },
          { knobId: 'seq_6_pitch',    value: 2.0 },
          { knobId: 'seq_6_vel',      value: 5.0 },
          { knobId: 'seq_7_pitch',    value: 3.0 },
          { knobId: 'seq_7_vel',      value: 6.0 },
          { knobId: 'seq_8_pitch',    value: 2.0 },
          { knobId: 'seq_8_vel',      value: 8.0 },
        ],
      },
      connections: {
        create: [
          // Pitch CV → VCO1 for sequencer pitch tracking
          { fromJack: 'pitch_out',      toJack: 'vco1_cv_in',   color: 'orange' },
          // Velocity CV → VCA CV for dynamic accents
          { fromJack: 'velocity_out',   toJack: 'vca_cv_in',    color: 'blue'   },
        ],
      },
    },
  })

  // ── PATCH 2: Squelch Acid ─────────────────────────────────────────────────
  // 303-style acid bassline. VCO1+VCO2 in square, high resonance,
  // VCO2 audio routed into FM input for extra harmonic dirt.
  const squelchAcid = await prisma.patch.create({
    data: {
      name: 'Squelch Acid',
      device: 'DFAM',
      description: 'Classic acid bassline texture. Square waves, high resonance, VCO2 self-patched into 1-2 FM for extra grit. Vary VCF cutoff live.',
      tags: ['acid', 'bass', 'techno'],
      sequenceNotes: 'Program alternating high-low pitch patterns across steps 1–8. Accent steps 1 and 5 with high velocity. SEQ PITCH MOD set to VCO1.',
      knobSettings: {
        create: [
          // Pitch / FM / Sync
          { knobId: 'vco_decay',      value: 3.0 },
          { knobId: 'seq_pitch_mod',  value: 1   },  // SEQ → VCO1
          { knobId: 'vco1_eg_amount', value: 4.0 },  // moderate pitch env
          { knobId: 'vco1_freq',      value: 5.0 },
          { knobId: 'fm_1_2_amount',  value: 2.5 },  // VCO2 → VCO1 FM
          { knobId: 'hard_sync',      value: 0   },  // OFF
          { knobId: 'vco2_eg_amount', value: 0.0 },
          { knobId: 'vco2_freq',      value: 5.5 },  // slightly detuned
          // Wave / Mixer
          { knobId: 'vco1_wave',      value: 1   },  // SQR
          { knobId: 'vco1_level',     value: 8.0 },
          { knobId: 'noise_ext_level',value: 0.0 },
          { knobId: 'vco2_wave',      value: 1   },  // SQR
          { knobId: 'vco2_level',     value: 4.5 },
          // Filter
          { knobId: 'vcf_mode',       value: 1   },  // LP
          { knobId: 'vcf_cutoff',     value: 7.0 },
          { knobId: 'vcf_resonance',  value: 7.5 },  // high resonance = squelch
          { knobId: 'vcf_decay',      value: 4.0 },
          { knobId: 'vcf_eg_amount',  value: 6.0 },  // filter pops open each hit
          // Mod / VCA
          { knobId: 'vca_eg',         value: 0   },  // FAST
          { knobId: 'volume',         value: 7.0 },
          { knobId: 'noise_vcf_mod',  value: 0.0 },
          { knobId: 'vca_decay',      value: 4.5 },
          // Sequencer
          { knobId: 'tempo',          value: 6.0 },
          { knobId: 'seq_1_pitch',    value: 3.0 },
          { knobId: 'seq_1_vel',      value: 10  },
          { knobId: 'seq_2_pitch',    value: 7.0 },
          { knobId: 'seq_2_vel',      value: 6.0 },
          { knobId: 'seq_3_pitch',    value: 3.5 },
          { knobId: 'seq_3_vel',      value: 7.0 },
          { knobId: 'seq_4_pitch',    value: 8.0 },
          { knobId: 'seq_4_vel',      value: 5.0 },
          { knobId: 'seq_5_pitch',    value: 3.0 },
          { knobId: 'seq_5_vel',      value: 10  },
          { knobId: 'seq_6_pitch',    value: 6.5 },
          { knobId: 'seq_6_vel',      value: 6.0 },
          { knobId: 'seq_7_pitch',    value: 4.0 },
          { knobId: 'seq_7_vel',      value: 8.0 },
          { knobId: 'seq_8_pitch',    value: 9.0 },
          { knobId: 'seq_8_vel',      value: 5.0 },
        ],
      },
      connections: {
        create: [
          // VCO2 audio into FM input for harmonic grit
          { fromJack: 'vco2_audio_out', toJack: 'fm_1_2_amt_in',  color: 'orange' },
          // Pitch sequencer → VCO1 CV
          { fromJack: 'pitch_out',      toJack: 'vco1_cv_in',     color: 'blue'   },
          // Trigger advances sequencer externally when needed
          { fromJack: 'trigger_out',    toJack: 'adv_clock_in',   color: 'green'  },
        ],
      },
    },
  })

  // ── PATCH 3: Dark Drone ───────────────────────────────────────────────────
  // Slow evolving ambient texture. Both VCOs slow and detuned, long decays,
  // VCO1 audio into VCF MOD for slow filter movement.
  const darkDrone = await prisma.patch.create({
    data: {
      name: 'Dark Drone',
      device: 'DFAM',
      description: 'Slow evolving drone. VCOs detuned against each other, VCO1 audio modulates filter for organic movement. VCA EG on SLOW for long fades.',
      tags: ['drone', 'ambient', 'dark'],
      sequenceNotes: 'Set all 8 pitch steps to the same value for a constant tone. Or slowly drift pitch values apart over 8 steps for gradual evolution. Open VCF cutoff slowly while playing.',
      knobSettings: {
        create: [
          // Pitch / FM / Sync
          { knobId: 'vco_decay',      value: 9.5 },  // very long pitch decay
          { knobId: 'seq_pitch_mod',  value: 1   },  // SEQ → VCO1
          { knobId: 'vco1_eg_amount', value: -3.0 }, // slight downward pitch drift
          { knobId: 'vco1_freq',      value: 1.5 },  // very low
          { knobId: 'fm_1_2_amount',  value: 3.0 },  // some FM between VCOs
          { knobId: 'hard_sync',      value: 0   },  // OFF
          { knobId: 'vco2_eg_amount', value: 0.0 },
          { knobId: 'vco2_freq',      value: 2.2 },  // slightly detuned from VCO1
          // Wave / Mixer
          { knobId: 'vco1_wave',      value: 0   },  // TRI — sine-like
          { knobId: 'vco1_level',     value: 7.0 },
          { knobId: 'noise_ext_level',value: 1.0 },  // faint noise undertone
          { knobId: 'vco2_wave',      value: 0   },  // TRI
          { knobId: 'vco2_level',     value: 7.0 },
          // Filter
          { knobId: 'vcf_mode',       value: 1   },  // LP
          { knobId: 'vcf_cutoff',     value: 3.5 },  // dark and filtered
          { knobId: 'vcf_resonance',  value: 4.0 },
          { knobId: 'vcf_decay',      value: 9.5 },  // filter stays open long
          { knobId: 'vcf_eg_amount',  value: 2.5 },
          // Mod / VCA
          { knobId: 'vca_eg',         value: 1   },  // SLOW — long fade in/out
          { knobId: 'volume',         value: 6.5 },
          { knobId: 'noise_vcf_mod',  value: 1.5 },  // noise slowly modulates filter
          { knobId: 'vca_decay',      value: 9.8 },  // extremely long tail
          // Sequencer
          { knobId: 'tempo',          value: 1.5 },  // very slow
          // All steps at same pitch for static drone
          { knobId: 'seq_1_pitch',    value: 4.0 },
          { knobId: 'seq_1_vel',      value: 7.0 },
          { knobId: 'seq_2_pitch',    value: 4.2 },
          { knobId: 'seq_2_vel',      value: 6.5 },
          { knobId: 'seq_3_pitch',    value: 4.0 },
          { knobId: 'seq_3_vel',      value: 7.0 },
          { knobId: 'seq_4_pitch',    value: 4.5 },
          { knobId: 'seq_4_vel',      value: 6.0 },
          { knobId: 'seq_5_pitch',    value: 4.0 },
          { knobId: 'seq_5_vel',      value: 7.5 },
          { knobId: 'seq_6_pitch',    value: 3.8 },
          { knobId: 'seq_6_vel',      value: 6.5 },
          { knobId: 'seq_7_pitch',    value: 4.0 },
          { knobId: 'seq_7_vel',      value: 7.0 },
          { knobId: 'seq_8_pitch',    value: 4.3 },
          { knobId: 'seq_8_vel',      value: 6.0 },
        ],
      },
      connections: {
        create: [
          // Pitch CV → VCO1 for sequencer control
          { fromJack: 'pitch_out',      toJack: 'vco1_cv_in',   color: 'orange' },
          // VCO1 audio → VCF MOD for slow filter wobble
          { fromJack: 'vco1_audio_out', toJack: 'vcf_mod_in',   color: 'blue'   },
          // VCO2 audio → 1-2 FM input for inter-osc modulation
          { fromJack: 'vco2_audio_out', toJack: 'fm_1_2_amt_in',color: 'white'  },
        ],
      },
    },
  })

  console.log('Seeded:')
  console.log(' ', heavyKick.name)
  console.log(' ', squelchAcid.name)
  console.log(' ', darkDrone.name)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
