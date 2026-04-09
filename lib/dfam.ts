export type KnobSection = 'oscillators' | 'noise' | 'envelope' | 'filter' | 'sequencer'

export interface KnobDef {
  id: string
  label: string
  section: KnobSection
  type: 'knob' | 'switch'
  defaultValue: number
  options?: [string, string]
}

export interface JackDef {
  id: string
  label: string
  x: number
  y: number
}

export interface CableColorDef {
  id: string
  hex: string
  label: string
}

export const DFAM_KNOBS: KnobDef[] = [
  // Oscillators — VCO 1
  { id: 'vco1_freq',      label: 'FREQ',    section: 'oscillators', type: 'knob',   defaultValue: 5 },
  { id: 'vco1_level',     label: 'LEVEL',   section: 'oscillators', type: 'knob',   defaultValue: 7 },
  { id: 'vco1_fm_amount', label: 'FM AMT',  section: 'oscillators', type: 'knob',   defaultValue: 0 },
  { id: 'vco1_mode',      label: 'MODE',    section: 'oscillators', type: 'switch', defaultValue: 0, options: ['AUDIO', 'LOW'] },
  // Oscillators — VCO 2
  { id: 'vco2_freq',      label: 'FREQ',    section: 'oscillators', type: 'knob',   defaultValue: 5 },
  { id: 'vco2_level',     label: 'LEVEL',   section: 'oscillators', type: 'knob',   defaultValue: 7 },
  { id: 'vco2_fm_amount', label: 'FM AMT',  section: 'oscillators', type: 'knob',   defaultValue: 0 },
  { id: 'vco2_mode',      label: 'MODE',    section: 'oscillators', type: 'switch', defaultValue: 0, options: ['AUDIO', 'LOW'] },
  // Noise
  { id: 'noise_level',    label: 'NOISE',   section: 'noise',       type: 'knob',   defaultValue: 0 },
  // Envelope and Dynamics
  { id: 'vco_decay',      label: 'VCO DCY', section: 'envelope',    type: 'knob',   defaultValue: 5 },
  { id: 'vcf_decay',      label: 'VCF DCY', section: 'envelope',    type: 'knob',   defaultValue: 5 },
  { id: 'vca_decay',      label: 'VCA DCY', section: 'envelope',    type: 'knob',   defaultValue: 5 },
  // Filter
  { id: 'vcf_cutoff',     label: 'CUTOFF',  section: 'filter',      type: 'knob',   defaultValue: 7 },
  { id: 'vcf_resonance',  label: 'RES',     section: 'filter',      type: 'knob',   defaultValue: 3 },
  { id: 'vcf_mod_amount', label: 'MOD AMT', section: 'filter',      type: 'knob',   defaultValue: 5 },
  // Sequencer
  { id: 'tempo',          label: 'TEMPO',   section: 'sequencer',   type: 'knob',   defaultValue: 5 },
]

export const SEQUENCER_STEPS = 8

// SVG viewBox: 0 0 700 110 — Outputs (8) at y=28, Inputs (12) at y=82
export const DFAM_JACKS = {
  outputs: [
    { id: 'vco1_out',     label: 'VCO 1',   x: 40,  y: 28 },
    { id: 'vco2_out',     label: 'VCO 2',   x: 128, y: 28 },
    { id: 'noise_out',    label: 'NOISE',   x: 216, y: 28 },
    { id: 'vcf_out',      label: 'VCF',     x: 304, y: 28 },
    { id: 'vca_out',      label: 'VCA',     x: 392, y: 28 },
    { id: 'velocity_out', label: 'VEL',     x: 480, y: 28 },
    { id: 'trigger_out',  label: 'TRIG',    x: 568, y: 28 },
    { id: 'pitch_out',    label: 'PITCH',   x: 656, y: 28 },
  ] as JackDef[],
  inputs: [
    { id: 'vco1_cv',        label: 'V1 CV',   x: 30,  y: 82 },
    { id: 'vco2_cv',        label: 'V2 CV',   x: 88,  y: 82 },
    { id: 'vcf_cutoff_in',  label: 'VCF CUT', x: 146, y: 82 },
    { id: 'vca_cv',         label: 'VCA CV',  x: 204, y: 82 },
    { id: 'vcf_mod_in',     label: 'VCF MOD', x: 262, y: 82 },
    { id: 'vco1_fm',        label: 'V1 FM',   x: 320, y: 82 },
    { id: 'vco2_fm',        label: 'V2 FM',   x: 378, y: 82 },
    { id: 'noise_level_in', label: 'NOISE',   x: 436, y: 82 },
    { id: 'vco_decay_in',   label: 'VCO DCY', x: 494, y: 82 },
    { id: 'vcf_decay_in',   label: 'VCF DCY', x: 552, y: 82 },
    { id: 'vca_decay_in',   label: 'VCA DCY', x: 610, y: 82 },
    { id: 'adv_clock',      label: 'ADV/CLK', x: 668, y: 82 },
  ] as JackDef[],
}

export const CABLE_COLORS: CableColorDef[] = [
  { id: 'orange', hex: '#e07b39', label: 'Orange' },
  { id: 'blue',   hex: '#5b9bd5', label: 'Blue' },
  { id: 'green',  hex: '#7ec87e', label: 'Green' },
  { id: 'red',    hex: '#e05555', label: 'Red' },
  { id: 'white',  hex: '#dddddd', label: 'White' },
]
