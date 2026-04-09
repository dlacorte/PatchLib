import { render, screen, fireEvent } from '@testing-library/react'
import { WaveToggle } from '@/components/dfam/WaveToggle'

describe('WaveToggle', () => {
  it('renders default OFF and ON buttons when no options provided', () => {
    render(<WaveToggle id="test" label="MODE" value={0} onChange={jest.fn()} />)
    expect(screen.getByText('OFF')).toBeInTheDocument()
    expect(screen.getByText('ON')).toBeInTheDocument()
  })

  it('renders custom 2-option toggle', () => {
    render(<WaveToggle id="vco1_wave" label="WAVE" value={0} onChange={jest.fn()} options={['TRI', 'SQR']} />)
    expect(screen.getByText('TRI')).toBeInTheDocument()
    expect(screen.getByText('SQR')).toBeInTheDocument()
  })

  it('renders 3-option switch (SEQ PITCH MOD)', () => {
    render(<WaveToggle id="seq_pitch_mod" label="SEQ PITCH MOD" value={0} onChange={jest.fn()} options={['OFF', 'VCO1', 'VCO2']} />)
    expect(screen.getByText('OFF')).toBeInTheDocument()
    expect(screen.getByText('VCO1')).toBeInTheDocument()
    expect(screen.getByText('VCO2')).toBeInTheDocument()
  })

  it('calls onChange with correct index when option is clicked', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="seq_pitch_mod" label="MOD" value={0} onChange={onChange} options={['OFF', 'VCO1', 'VCO2']} />)
    fireEvent.click(screen.getByText('VCO2'))
    expect(onChange).toHaveBeenCalledWith('seq_pitch_mod', 2)
  })

  it('calls onChange with 1 when second option is clicked', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_wave" label="WAVE" value={0} onChange={onChange} options={['TRI', 'SQR']} />)
    fireEvent.click(screen.getByText('SQR'))
    expect(onChange).toHaveBeenCalledWith('vco1_wave', 1)
  })

  it('calls onChange with 0 when first option is clicked', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_wave" label="WAVE" value={1} onChange={onChange} options={['TRI', 'SQR']} />)
    fireEvent.click(screen.getByText('TRI'))
    expect(onChange).toHaveBeenCalledWith('vco1_wave', 0)
  })
})
