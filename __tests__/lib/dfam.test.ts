import { DFAM_KNOBS, DFAM_JACKS, CABLE_COLORS } from '@/lib/dfam'

describe('DFAM_KNOBS', () => {
  it('has 13 main knobs and toggles', () => {
    const main = DFAM_KNOBS.filter(k => k.section === 'main')
    expect(main).toHaveLength(13)
  })

  it('has 11 rotary knobs in main section', () => {
    const knobs = DFAM_KNOBS.filter(k => k.section === 'main' && k.type === 'knob')
    expect(knobs).toHaveLength(11)
  })

  it('has 2 toggle switches in main section', () => {
    const toggles = DFAM_KNOBS.filter(k => k.section === 'main' && k.type === 'toggle')
    expect(toggles).toHaveLength(2)
    expect(toggles.map(t => t.id)).toEqual(['vco1_wave', 'vco2_wave'])
  })
})

describe('DFAM_JACKS', () => {
  it('has 7 outputs', () => {
    expect(DFAM_JACKS.outputs).toHaveLength(7)
  })

  it('has 7 inputs', () => {
    expect(DFAM_JACKS.inputs).toHaveLength(7)
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
