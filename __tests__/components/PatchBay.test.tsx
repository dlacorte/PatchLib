import { render, screen, fireEvent } from '@testing-library/react'
import { PatchBay } from '@/components/dfam/PatchBay'
import { DFAM_PATCH_POINTS } from '@/lib/dfam'

const dfamPoints = { deviceId: 'DFAM', deviceLabel: 'DFAM', points: DFAM_PATCH_POINTS }

describe('PatchBay', () => {
  it('renders all jack buttons for a single device', () => {
    render(<PatchBay devicePoints={[dfamPoints]} connections={[]} onChange={jest.fn()} />)
    // Each jack has a button
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0)
  })

  it('renders device section label', () => {
    render(<PatchBay devicePoints={[dfamPoints]} connections={[]} onChange={jest.fn()} />)
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('clicking an out jack then an in jack adds a connection with prefixed IDs', () => {
    const onChange = jest.fn()
    render(<PatchBay devicePoints={[dfamPoints]} connections={[]} onChange={onChange} selectedColor="orange" />)
    fireEvent.click(screen.getByTestId('jack-dfam:trigger_out'))
    fireEvent.click(screen.getByTestId('jack-dfam:trigger_in'))
    expect(onChange).toHaveBeenCalledWith([
      { fromJack: 'dfam:trigger_out', toJack: 'dfam:trigger_in', color: 'orange' },
    ])
  })

  it('renders two device sections when two devices passed', () => {
    render(
      <PatchBay
        devicePoints={[dfamPoints, { deviceId: 'XFAM', deviceLabel: 'XFAM', points: DFAM_PATCH_POINTS }]}
        connections={[]}
        onChange={jest.fn()}
      />
    )
    expect(screen.getByText('DFAM')).toBeInTheDocument()
    expect(screen.getByText('XFAM')).toBeInTheDocument()
  })
})
