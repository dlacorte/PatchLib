import { render, screen } from '@testing-library/react'
import { KnobGrid } from '@/components/dfam/KnobGrid'

describe('KnobGrid', () => {
  const onChange = jest.fn()

  it('renders main panel section heading', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText(/main panel/i)).toBeInTheDocument()
  })

  it('renders TEMPO knob label', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders VCO wave toggles (TRI buttons should appear)', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getAllByText('TRI').length).toBeGreaterThan(0)
  })

  it('renders sequencer section heading', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText(/sequencer/i)).toBeInTheDocument()
  })
})
