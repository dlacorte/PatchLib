import { DFAM_KNOBS, DFAM_JACKS, CABLE_COLORS } from '@/lib/dfam'

describe('DFAM_KNOBS', () => {
  it('has 8 oscillator controls (4 per VCO)', () => {
    const osc = DFAM_KNOBS.filter(k => k.section === 'oscillators')
    expect(osc).toHaveLength(8)
  })

  it('has 2 mode switches in oscillator section', () => {
    const switches = DFAM_KNOBS.filter(k => k.section === 'oscillators' && k.type === 'switch')
    expect(switches).toHaveLength(2)
    expect(switches.map(s => s.id)).toEqual(['vco1_mode', 'vco2_mode'])
  })

  it('has 3 envelope knobs', () => {
    const env = DFAM_KNOBS.filter(k => k.section === 'envelope')
    expect(env).toHaveLength(3)
  })

  it('has 3 filter knobs', () => {
    const filter = DFAM_KNOBS.filter(k => k.section === 'filter')
    expect(filter).toHaveLength(3)
  })

  it('has tempo in sequencer section', () => {
    const seq = DFAM_KNOBS.filter(k => k.section === 'sequencer')
    expect(seq).toHaveLength(1)
    expect(seq[0].id).toBe('tempo')
  })
})

describe('DFAM_JACKS', () => {
  it('has 8 outputs', () => {
    expect(DFAM_JACKS.outputs).toHaveLength(8)
  })

  it('has 12 inputs', () => {
    expect(DFAM_JACKS.inputs).toHaveLength(12)
  })

  it('all jacks have id, label, x, y', () => {
    const allJacks = [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs]
    allJacks.forEach(j => {
      expect(j.id).toBeTruthy()
      expect(j.label).toBeTruthy()
      expect(typeof j.x).toBe('number')
      expect(typeof j.y).toBe('number')
    })
  })

  it('has no duplicate jack ids', () => {
    const allJacks = [...DFAM_JACKS.outputs, ...DFAM_JACKS.inputs]
    const ids = allJacks.map(j => j.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('CABLE_COLORS', () => {
  it('has 5 colors', () => {
    expect(CABLE_COLORS).toHaveLength(5)
  })

  it('includes orange as first color', () => {
    expect(CABLE_COLORS[0].id).toBe('orange')
  })
})
