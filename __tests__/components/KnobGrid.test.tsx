import { render, screen } from '@testing-library/react'
import { KnobGrid } from '@/components/dfam/KnobGrid'

describe('KnobGrid', () => {
  const onChange = jest.fn()

  it('renders Sound Engine zone label', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText(/sound engine/i)).toBeInTheDocument()
  })

  it('renders Pitch · FM · Sync block label', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText(/pitch.*fm.*sync/i)).toBeInTheDocument()
  })

  it('renders TEMPO knob label', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders sequencer section heading', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText(/sequencer/i)).toBeInTheDocument()
  })

  it('renders RUN transport button', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    expect(screen.getByText('RUN')).toBeInTheDocument()
  })

  it('renders SEQ PITCH MOD 3-way switch with all 3 options', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    // OFF appears on multiple switches; use getAllByText
    expect(screen.getAllByText('OFF').length).toBeGreaterThan(0)
    expect(screen.getByText('VCO1')).toBeInTheDocument()
    expect(screen.getByText('VCO2')).toBeInTheDocument()
  })

  it('renders HARD SYNC toggle', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    // HARD SYNC has OFF/ON options — at least one ON button present
    expect(screen.getAllByText('ON').length).toBeGreaterThan(0)
  })

  it('renders 8 sequencer step numbers', () => {
    render(<KnobGrid values={{}} onChange={onChange} />)
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })
})
