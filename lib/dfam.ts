export type KnobSection = 'pitch_fm_sync' | 'wave_mixer' | 'filter' | 'mod_vca' | 'sequencer'

export interface KnobDef {
  id: string
  label: string
  section: KnobSection
  type: 'knob' | 'switch'
  min: number           // default 0
  max: number           // default 10
  defaultValue: number
  options?: string[]    // for switch: 2 or 3 option labels
}

export interface PatchPointDef {
  id: string
  label: string
  direction: 'in' | 'out'
  row: number           // 1–8
  col: number           // 1–3
}

export interface CableColorDef {
  id: string
  hex: string
  label: string
}

// ── SOUND ENGINE ────────────────────────────────────────────────────────────

export const DFAM_KNOBS: KnobDef[] = [

  // LEFT BLOCK — Pitch + FM + Sync
  // Grid 2 rows × 4 cols:
  //   Row 1: VCO DECAY | SEQ PITCH MOD | VCO 1 EG AMT | VCO 1 FREQ
  //   Row 2: 1-2 FM AMT | HARD SYNC    | VCO 2 EG AMT | VCO 2 FREQ
  { id: 'vco_decay',       label: 'VCO DECAY',      section: 'pitch_fm_sync', type: 'knob',   min: 0,   max: 10, defaultValue: 5 },
  { id: 'seq_pitch_mod',   label: 'SEQ PITCH MOD',  section: 'pitch_fm_sync', type: 'switch', min: 0,   max: 2,  defaultValue: 0, options: ['OFF', 'VCO1', 'VCO2'] },
  { id: 'vco1_eg_amount',  label: 'VCO 1 EG AMT',   section: 'pitch_fm_sync', type: 'knob',   min: -10, max: 10, defaultValue: 0 },
  { id: 'vco1_freq',       label: 'VCO 1 FREQ',     section: 'pitch_fm_sync', type: 'knob',   min: 0,   max: 10, defaultValue: 5 },
  { id: 'fm_1_2_amount',   label: '1-2 FM AMT',     section: 'pitch_fm_sync', type: 'knob',   min: 0,   max: 10, defaultValue: 0 },
  { id: 'hard_sync',       label: 'HARD SYNC',      section: 'pitch_fm_sync', type: 'switch', min: 0,   max: 1,  defaultValue: 0, options: ['OFF', 'ON'] },
  { id: 'vco2_eg_amount',  label: 'VCO 2 EG AMT',   section: 'pitch_fm_sync', type: 'knob',   min: -10, max: 10, defaultValue: 0 },
  { id: 'vco2_freq',       label: 'VCO 2 FREQ',     section: 'pitch_fm_sync', type: 'knob',   min: 0,   max: 10, defaultValue: 5 },

  // CENTER-LEFT BLOCK — Wave + Mixer
  { id: 'vco1_wave',       label: 'VCO 1 WAVE',     section: 'wave_mixer',    type: 'switch', min: 0,   max: 1,  defaultValue: 0, options: ['TRI', 'SQR'] },
  { id: 'vco1_level',      label: 'VCO 1 LEVEL',    section: 'wave_mixer',    type: 'knob',   min: 0,   max: 10, defaultValue: 7 },
  { id: 'noise_ext_level', label: 'NOISE/EXT LVL',  section: 'wave_mixer',    type: 'knob',   min: 0,   max: 10, defaultValue: 0 },
  { id: 'vco2_wave',       label: 'VCO 2 WAVE',     section: 'wave_mixer',    type: 'switch', min: 0,   max: 1,  defaultValue: 0, options: ['TRI', 'SQR'] },
  { id: 'vco2_level',      label: 'VCO 2 LEVEL',    section: 'wave_mixer',    type: 'knob',   min: 0,   max: 10, defaultValue: 7 },

  // CENTER BLOCK — Filter
  { id: 'vcf_mode',        label: 'VCF MODE',       section: 'filter',        type: 'switch', min: 0,   max: 1,  defaultValue: 1, options: ['HP', 'LP'] },
  { id: 'vcf_cutoff',      label: 'CUTOFF',         section: 'filter',        type: 'knob',   min: 0,   max: 10, defaultValue: 7 },
  { id: 'vcf_resonance',   label: 'RESONANCE',      section: 'filter',        type: 'knob',   min: 0,   max: 10, defaultValue: 3 },
  { id: 'vcf_decay',       label: 'VCF DECAY',      section: 'filter',        type: 'knob',   min: 0,   max: 10, defaultValue: 5 },
  { id: 'vcf_eg_amount',   label: 'VCF EG AMT',     section: 'filter',        type: 'knob',   min: -10, max: 10, defaultValue: 0 },

  // CENTER-RIGHT BLOCK — Modulation + VCA
  { id: 'vca_eg',          label: 'VCA EG',         section: 'mod_vca',       type: 'switch', min: 0,   max: 1,  defaultValue: 0, options: ['FAST', 'SLOW'] },
  { id: 'volume',          label: 'VOLUME',         section: 'mod_vca',       type: 'knob',   min: 0,   max: 10, defaultValue: 7 },
  { id: 'noise_vcf_mod',   label: 'NOISE/VCF MOD',  section: 'mod_vca',       type: 'knob',   min: -10, max: 10, defaultValue: 0 },
  { id: 'vca_decay',       label: 'VCA DECAY',      section: 'mod_vca',       type: 'knob',   min: 0,   max: 10, defaultValue: 5 },

  // SEQUENCER
  { id: 'tempo',           label: 'TEMPO',          section: 'sequencer',     type: 'knob',   min: 0,   max: 10, defaultValue: 5 },
]

export const SEQUENCER_STEPS = 8

// ── PATCHBAY — 8 rows × 3 columns ───────────────────────────────────────────

export const DFAM_PATCH_POINTS: PatchPointDef[] = [
  // Row 1
  { id: 'trigger_out',      label: 'TRIGGER',    direction: 'out', row: 1, col: 1 },
  { id: 'in_out',           label: 'IN / OUT',   direction: 'out', row: 1, col: 2 },
  { id: 'vca_cv_in',        label: 'VCA CV',     direction: 'in',  row: 1, col: 3 },
  // Row 2
  { id: 'velocity_cv_out',  label: 'VELOCITY',   direction: 'out', row: 2, col: 1 },
  { id: 'vca_decay_in',     label: 'VCA DECAY',  direction: 'in',  row: 2, col: 2 },
  { id: 'vca_eg_in',        label: 'VCA EG',     direction: 'in',  row: 2, col: 3 },
  // Row 3
  { id: 'ext_audio_in',     label: 'EXT AUDIO',  direction: 'in',  row: 3, col: 1 },
  { id: 'vcf_decay_in',     label: 'VCF DECAY',  direction: 'in',  row: 3, col: 2 },
  { id: 'vcf_eg_in',        label: 'VCF EG',     direction: 'in',  row: 3, col: 3 },
  // Row 4
  { id: 'noise_level_in',   label: 'NOISE LVL',  direction: 'in',  row: 4, col: 1 },
  { id: 'vco_decay_in',     label: 'VCO DECAY',  direction: 'in',  row: 4, col: 2 },
  { id: 'vco_eg_in',        label: 'VCO EG',     direction: 'in',  row: 4, col: 3 },
  // Row 5
  { id: 'vcf_mod_in',       label: 'VCF MOD',    direction: 'in',  row: 5, col: 1 },
  { id: 'vco1_cv_in',       label: 'VCO 1 CV',   direction: 'in',  row: 5, col: 2 },
  { id: 'vco1_audio_out',   label: 'VCO 1',      direction: 'out', row: 5, col: 3 },
  // Row 6
  { id: 'fm_1_2_amt_in',    label: '1-2 FM',     direction: 'in',  row: 6, col: 1 },
  { id: 'vco2_cv_in',       label: 'VCO 2 CV',   direction: 'in',  row: 6, col: 2 },
  { id: 'vco2_audio_out',   label: 'VCO 2',      direction: 'out', row: 6, col: 3 },
  // Row 7
  { id: 'tempo_in',         label: 'TEMPO',      direction: 'in',  row: 7, col: 1 },
  { id: 'run_stop_in',      label: 'RUN/STOP',   direction: 'in',  row: 7, col: 2 },
  { id: 'adv_clock_in',     label: 'ADV/CLK',    direction: 'in',  row: 7, col: 3 },
  // Row 8
  { id: 'trigger_in',       label: 'TRIGGER',    direction: 'in',  row: 8, col: 1 },
  { id: 'velocity_out',     label: 'VELOCITY',   direction: 'out', row: 8, col: 2 },
  { id: 'pitch_out',        label: 'PITCH',      direction: 'out', row: 8, col: 3 },
]

export const CABLE_COLORS: CableColorDef[] = [
  { id: 'orange', hex: '#e07b39', label: 'Orange' },
  { id: 'blue',   hex: '#5b9bd5', label: 'Blue' },
  { id: 'green',  hex: '#7ec87e', label: 'Green' },
  { id: 'red',    hex: '#e05555', label: 'Red' },
  { id: 'white',  hex: '#dddddd', label: 'White' },
]

// ── PANEL GEOMETRY ──────────────────────────────────────────────────────────

/** Row top y-positions (px) in the 1300×559 panel — 8 rows, scaled 1.3× */
export const JACK_ROWS = [74, 135, 196, 257, 319, 380, 441, 502]

/** Column x-offsets (px) within the patchbay strip — 3 columns */
export const JACK_COLS = [29, 86, 143]

/** Left edge of the patchbay strip in the panel */
export const PATCHBAY_LEFT = 1092

/** Returns the centre pixel coordinates of a jack socket in panel-local space */
export function getJackCoords(point: PatchPointDef): { x: number; y: number } {
  return {
    x: PATCHBAY_LEFT + JACK_COLS[point.col - 1],
    y: JACK_ROWS[point.row - 1],
  }
}
