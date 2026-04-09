export interface KnobDef {
  id: string
  label: string
  section: 'main' | 'sequencer'
  type: 'knob' | 'toggle'
  defaultValue: number
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
  // Main rotary knobs (11)
  { id: 'tempo',         label: 'TEMPO',      section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vco1_freq',     label: 'VCO1 FREQ',  section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vco2_freq',     label: 'VCO2 FREQ',  section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'noise_level',   label: 'NOISE',      section: 'main', type: 'knob',   defaultValue: 0 },
  { id: 'vco1_decay',    label: 'VCO1 DCY',   section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vco2_decay',    label: 'VCO2 DCY',   section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'eg_attack',     label: 'EG ATK',     section: 'main', type: 'knob',   defaultValue: 0 },
  { id: 'eg_decay',      label: 'EG DCY',     section: 'main', type: 'knob',   defaultValue: 5 },
  { id: 'vcf_cutoff',    label: 'VCF CUTOFF', section: 'main', type: 'knob',   defaultValue: 7 },
  { id: 'vcf_resonance', label: 'VCF RES',    section: 'main', type: 'knob',   defaultValue: 3 },
  { id: 'vca_level',     label: 'VCA LEVEL',  section: 'main', type: 'knob',   defaultValue: 8 },
  // Toggle switches (2)
  { id: 'vco1_wave',     label: 'VCO1 WAVE',  section: 'main', type: 'toggle', defaultValue: 0 },
  { id: 'vco2_wave',     label: 'VCO2 WAVE',  section: 'main', type: 'toggle', defaultValue: 0 },
]

export const SEQUENCER_STEPS = 8

// SVG viewBox: 0 0 560 100 — Outputs at y=25, Inputs at y=75
export const DFAM_JACKS = {
  outputs: [
    { id: 'vco1_out',   label: 'VCO1',   x: 35,  y: 25 },
    { id: 'vco2_out',   label: 'VCO2',   x: 105, y: 25 },
    { id: 'noise_out',  label: 'NOISE',  x: 175, y: 25 },
    { id: 'eg_out',     label: 'EG',     x: 245, y: 25 },
    { id: 'tempo_out',  label: 'TEMPO',  x: 315, y: 25 },
    { id: 'midi_gate',  label: 'M.GATE', x: 385, y: 25 },
    { id: 'midi_pitch', label: 'M.PCH',  x: 455, y: 25 },
  ] as JackDef[],
  inputs: [
    { id: 'vco1_fm',     label: 'V1 FM',   x: 35,  y: 75 },
    { id: 'vco2_fm',     label: 'V2 FM',   x: 105, y: 75 },
    { id: 'vcf_cv',      label: 'VCF CV',  x: 175, y: 75 },
    { id: 'audio_in',    label: 'AUDIO',   x: 245, y: 75 },
    { id: 'adv_clock',   label: 'ADV/CLK', x: 315, y: 75 },
    { id: 'run_stop',    label: 'RUN/STP', x: 385, y: 75 },
    { id: 'velocity_in', label: 'VEL IN',  x: 455, y: 75 },
  ] as JackDef[],
}

export const CABLE_COLORS: CableColorDef[] = [
  { id: 'orange', hex: '#e07b39', label: 'Orange' },
  { id: 'blue',   hex: '#5b9bd5', label: 'Blue' },
  { id: 'green',  hex: '#7ec87e', label: 'Green' },
  { id: 'red',    hex: '#e05555', label: 'Red' },
  { id: 'white',  hex: '#dddddd', label: 'White' },
]
