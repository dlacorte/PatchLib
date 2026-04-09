import { render, screen, fireEvent } from '@testing-library/react'
import { PatchBay } from '@/components/dfam/PatchBay'

const noConnections: Array<{ fromJack: string; toJack: string; color: string }> = []

describe('PatchBay', () => {
  it('renders output jack label VCO 1', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('VCO 1')).toBeInTheDocument()
  })

  it('renders input jack label V1 CV', () => {
    render(<PatchBay connections={noConnections} onChange={jest.fn()} />)
    expect(screen.getByText('V1 CV')).toBeInTheDocument()
  })

  it('calls onChange when a complete connection is made via clicking output then input', () => {
    const onChange = jest.fn()
    const { getByTestId } = render(<PatchBay connections={noConnections} onChange={onChange} />)
    fireEvent.click(getByTestId('jack-vco1_out'))
    fireEvent.click(getByTestId('jack-vco1_cv'))
    expect(onChange).toHaveBeenCalledWith([
      { fromJack: 'vco1_out', toJack: 'vco1_cv', color: 'orange' }
    ])
  })

  it('renders a cable as SVG path when connection exists', () => {
    const connections = [{ fromJack: 'vco1_out', toJack: 'vco1_cv', color: 'orange' }]
    const { container } = render(<PatchBay connections={connections} onChange={jest.fn()} />)
    const paths = container.querySelectorAll('path[data-cable]')
    expect(paths.length).toBe(1)
  })
})
