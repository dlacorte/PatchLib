import { DEVICES, getDevice, prefixJackId, parseJackId } from '@/lib/devices'

describe('DEVICES', () => {
  it('contains DFAM and XFAM', () => {
    const ids = DEVICES.map(d => d.id)
    expect(ids).toContain('DFAM')
    expect(ids).toContain('XFAM')
  })

  it('XFAM has same number of knobs as DFAM', () => {
    const dfam = getDevice('DFAM')
    const xfam = getDevice('XFAM')
    expect(xfam.knobs.length).toBe(dfam.knobs.length)
  })

  it('getDevice throws on unknown device', () => {
    expect(() => getDevice('BOGUS')).toThrow('Unknown device: BOGUS')
  })
})

describe('prefixJackId / parseJackId', () => {
  it('prefixes a jack ID with device', () => {
    expect(prefixJackId('DFAM', 'trigger_out')).toBe('dfam:trigger_out')
  })

  it('parses a prefixed jack ID', () => {
    expect(parseJackId('dfam:trigger_out')).toEqual({ deviceId: 'DFAM', jackId: 'trigger_out' })
  })

  it('parseJackId throws on unprefixed ID', () => {
    expect(() => parseJackId('trigger_out')).toThrow()
  })
})
