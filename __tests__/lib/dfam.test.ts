import { DFAM_KNOBS, DFAM_PATCH_POINTS, CABLE_COLORS } from '@/lib/dfam'

describe('DFAM_KNOBS', () => {
  it('has 8 pitch/fm/sync controls', () => {
    const pfs = DFAM_KNOBS.filter(k => k.section === 'pitch_fm_sync')
    expect(pfs).toHaveLength(8)
  })

  it('has 2 switches in pitch_fm_sync section', () => {
    const switches = DFAM_KNOBS.filter(k => k.section === 'pitch_fm_sync' && k.type === 'switch')
    expect(switches).toHaveLength(2)
    expect(switches.map(s => s.id)).toEqual(['seq_pitch_mod', 'hard_sync'])
  })

  it('seq_pitch_mod has 3 options', () => {
    const sw = DFAM_KNOBS.find(k => k.id === 'seq_pitch_mod')
    expect(sw?.options).toEqual(['OFF', 'VCO1', 'VCO2'])
  })

  it('has 5 wave_mixer controls', () => {
    const wm = DFAM_KNOBS.filter(k => k.section === 'wave_mixer')
    expect(wm).toHaveLength(5)
  })

  it('has 5 filter controls', () => {
    const filter = DFAM_KNOBS.filter(k => k.section === 'filter')
    expect(filter).toHaveLength(5)
  })

  it('has 4 mod_vca controls', () => {
    const mv = DFAM_KNOBS.filter(k => k.section === 'mod_vca')
    expect(mv).toHaveLength(4)
  })

  it('has tempo in sequencer section', () => {
    const seq = DFAM_KNOBS.filter(k => k.section === 'sequencer')
    expect(seq).toHaveLength(1)
    expect(seq[0].id).toBe('tempo')
  })

  it('bipolar knobs have min=-10 and max=10', () => {
    const bipolar = DFAM_KNOBS.filter(k => k.min === -10)
    expect(bipolar.length).toBeGreaterThan(0)
    bipolar.forEach(k => {
      expect(k.min).toBe(-10)
      expect(k.max).toBe(10)
    })
  })

  it('all knobs have id, label, section, type, min, max, defaultValue', () => {
    DFAM_KNOBS.forEach(k => {
      expect(k.id).toBeTruthy()
      expect(k.label).toBeTruthy()
      expect(k.section).toBeTruthy()
      expect(['knob', 'switch']).toContain(k.type)
      expect(typeof k.min).toBe('number')
      expect(typeof k.max).toBe('number')
      expect(typeof k.defaultValue).toBe('number')
    })
  })
})

describe('DFAM_PATCH_POINTS', () => {
  it('has 24 patch points (8 rows × 3 cols)', () => {
    expect(DFAM_PATCH_POINTS).toHaveLength(24)
  })

  it('has 7 output jacks', () => {
    expect(DFAM_PATCH_POINTS.filter(p => p.direction === 'out')).toHaveLength(7)
  })

  it('has 17 input jacks', () => {
    expect(DFAM_PATCH_POINTS.filter(p => p.direction === 'in')).toHaveLength(17)
  })

  it('all patch points span rows 1–8 and cols 1–3', () => {
    DFAM_PATCH_POINTS.forEach(p => {
      expect(p.row).toBeGreaterThanOrEqual(1)
      expect(p.row).toBeLessThanOrEqual(8)
      expect(p.col).toBeGreaterThanOrEqual(1)
      expect(p.col).toBeLessThanOrEqual(3)
    })
  })

  it('has no duplicate patch point ids', () => {
    const ids = DFAM_PATCH_POINTS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all patch points have id, label, direction, row, col', () => {
    DFAM_PATCH_POINTS.forEach(p => {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(['in', 'out']).toContain(p.direction)
      expect(typeof p.row).toBe('number')
      expect(typeof p.col).toBe('number')
    })
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
