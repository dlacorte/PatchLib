import { render, screen, fireEvent } from '@testing-library/react'
import { WaveToggle } from '@/components/dfam/WaveToggle'

describe('WaveToggle', () => {
  it('renders TRI and SAW buttons', () => {
    render(<WaveToggle id="vco1_wave" label="VCO1 WAVE" value={0} onChange={jest.fn()} />)
    expect(screen.getByText('TRI')).toBeInTheDocument()
    expect(screen.getByText('SAW')).toBeInTheDocument()
  })

  it('calls onChange with 1 when SAW is clicked from TRI state', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_wave" label="VCO1 WAVE" value={0} onChange={onChange} />)
    fireEvent.click(screen.getByText('SAW'))
    expect(onChange).toHaveBeenCalledWith('vco1_wave', 1)
  })

  it('calls onChange with 0 when TRI is clicked from SAW state', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_wave" label="VCO1 WAVE" value={1} onChange={onChange} />)
    fireEvent.click(screen.getByText('TRI'))
    expect(onChange).toHaveBeenCalledWith('vco1_wave', 0)
  })
})
