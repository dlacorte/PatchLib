/**
 * Returns a prefixed jack ID in the form `<deviceId_lowercase>:<jackId>`.
 * e.g. prefixJackId('DFAM', 'trigger_out') => 'dfam:trigger_out'
 */
export function prefixJackId(deviceId: string, jackId: string): string {
  return `${deviceId.toLowerCase()}:${jackId}`
}
