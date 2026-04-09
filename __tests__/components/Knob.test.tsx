import { render, screen } from '@testing-library/react'
import { Knob } from '@/components/dfam/Knob'

describe('Knob', () => {
  it('renders the label', () => {
    render(<Knob id="tempo" label="TEMPO" value={5} onChange={jest.fn()} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders the current value', () => {
    render(<Knob id="tempo" label="TEMPO" value={7.5} onChange={jest.fn()} />)
    expect(screen.getByText('7.5')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = render(<Knob id="tempo" label="TEMPO" value={5} onChange={jest.fn()} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
