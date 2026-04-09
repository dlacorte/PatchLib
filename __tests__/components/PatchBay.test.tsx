import { render, screen, fireEvent } from '@testing-library/react'
import { PatchBay } from '@/components/dfam/PatchBay'

const noConnections: Array<{ fromJack: string; toJack: string; color: string }> = []

describe('PatchBay', () => {
  it('renders output jack label VCO1', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('VCO1')).toBeInTheDocument()
  })

  it('renders input jack label AUDIO', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('AUDIO')).toBeInTheDocument()
  })

  it('calls onChange when a complete connection is made via clicking output then input', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(<PatchBay connections={noConnections} onChange={onChange} />)
    fireEvent.click(getByTestId('jack-vco1_out'))
    fireEvent.click(getByTestId('jack-audio_in'))
    expect(onChange).toHaveBeenCalledWith([
      { fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }
    ])
  })

  it('renders a cable as SVG path when connection exists', () => {
    const connections = [{ fromJack: 'vco1_out', toJack: 'audio_in', color: 'orange' }]
    const { container } = render(<PatchBay connections={connections} onChange={jest.fn()} />)
    const paths = container.querySelectorAll('path[data-cable]')
    expect(paths.length).toBe(1)
  })
})
