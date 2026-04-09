import { render, screen, fireEvent } from '@testing-library/react'
import { WaveToggle } from '@/components/dfam/WaveToggle'

describe('WaveToggle', () => {
  it('renders default OFF and ON buttons when no options provided', () => {
    render(<WaveToggle id="vco1_mode" label="MODE" value={0} onChange={jest.fn()} />)
    expect(screen.getByText('OFF')).toBeInTheDocument()
    expect(screen.getByText('ON')).toBeInTheDocument()
  })

  it('renders custom options when provided', () => {
    render(<WaveToggle id="vco1_mode" label="MODE" value={0} onChange={jest.fn()} options={['AUDIO', 'LOW']} />)
    expect(screen.getByText('AUDIO')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })

  it('calls onChange with 1 when second option is clicked', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_mode" label="MODE" value={0} onChange={onChange} options={['AUDIO', 'LOW']} />)
    fireEvent.click(screen.getByText('LOW'))
    expect(onChange).toHaveBeenCalledWith('vco1_mode', 1)
  })

  it('calls onChange with 0 when first option is clicked', () => {
    const onChange = jest.fn()
    render(<WaveToggle id="vco1_mode" label="MODE" value={1} onChange={onChange} options={['AUDIO', 'LOW']} />)
    fireEvent.click(screen.getByText('AUDIO'))
    expect(onChange).toHaveBeenCalledWith('vco1_mode', 0)
  })
})
