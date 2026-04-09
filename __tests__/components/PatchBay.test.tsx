import { render, screen, fireEvent } from '@testing-library/react'
import { PatchBay } from '@/components/dfam/PatchBay'

const noConnections: Array<{ fromJack: string; toJack: string; color: string }> = []

describe('PatchBay', () => {
  it('renders output jack label VCO 1', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('VCO 1')).toBeInTheDocument()
  })

  it('renders input jack label VCO 1 CV', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('VCO 1 CV')).toBeInTheDocument()
  })

  it('renders TRIGGER output jack', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    // Multiple TRIGGER labels may exist (trigger_out and trigger_in)
    expect(screen.getAllByText('TRIGGER').length).toBeGreaterThanOrEqual(1)
  })

  it('calls onChange when a complete connection is made via clicking output then input', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(<PatchBay connections={noConnections} onChange={onChange} />)
    fireEvent.click(getByTestId('jack-vco1_audio_out'))
    fireEvent.click(getByTestId('jack-vco1_cv_in'))
    expect(onChange).toHaveBeenCalledWith([
      { fromJack: 'vco1_audio_out', toJack: 'vco1_cv_in', color: 'orange' }
    ])
  })

  it('renders cables list when connection exists', () => {
    const connections = [{ fromJack: 'pitch_out', toJack: 'vco1_cv_in', color: 'orange' }]
    render(<PatchBay connections={connections} onChange={jest.fn()} />)
    expect(screen.getByText('Cables')).toBeInTheDocument()
  })

  it('does not call onChange when clicking an input with no pending output', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(<PatchBay connections={noConnections} onChange={onChange} />)
    fireEvent.click(getByTestId('jack-vco1_cv_in'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
