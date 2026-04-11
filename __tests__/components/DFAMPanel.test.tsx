import { render, screen, fireEvent } from '@testing-library/react'
import { DFAMPanel } from '@/components/dfam/DFAMPanel'

const noop = () => {}

describe('DFAMPanel', () => {
  it('renders the DFAM panel title', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('renders VCO DECAY knob label', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('VCO DECAY')).toBeInTheDocument()
  })

  it('renders TEMPO knob label', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('TEMPO')).toBeInTheDocument()
  })

  it('renders RUN transport button', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('RUN')).toBeInTheDocument()
  })

  it('renders TRIGGER button', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('TRIGGER')).toBeInTheDocument()
  })

  it('renders ADVANCE button', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('ADVANCE')).toBeInTheDocument()
  })

  it('renders 8 sequencer step numbers', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
  })

  it('renders SEQ PITCH MOD options OFF, VCO1, VCO2', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getAllByText('OFF').length).toBeGreaterThan(0)
    expect(screen.getByText('VCO1')).toBeInTheDocument()
    expect(screen.getByText('VCO2')).toBeInTheDocument()
  })

  it('renders HARD SYNC ON option', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getAllByText('ON').length).toBeGreaterThan(0)
  })

  it('renders VCF MODE switch (HP / LP)', () => {
    render(<DFAMPanel values={{}} onChange={noop} connections={[]} onConnectionsChange={noop} />)
    expect(screen.getByText('HP')).toBeInTheDocument()
    expect(screen.getByText('LP')).toBeInTheDocument()
  })
})

describe('DFAMPanel cable interaction', () => {
  const noop = () => {}

  it('accepts deviceId prop without crashing', () => {
    render(
      <DFAMPanel
        deviceId="DFAM"
        values={{}}
        onChange={noop}
        connections={[]}
        onConnectionsChange={noop}
      />
    )
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('clicking two jacks calls onConnectionsChange with a new connection', () => {
    const onConnectionsChange = jest.fn()
    const { container } = render(
      <DFAMPanel
        deviceId="DFAM"
        values={{}}
        onChange={noop}
        connections={[]}
        onConnectionsChange={onConnectionsChange}
      />
    )
    const triggerJack = container.querySelector('[data-jack="dfam:trigger_out"]')!
    const vcaJack = container.querySelector('[data-jack="dfam:vca_cv_in"]')!
    fireEvent.click(triggerJack)
    fireEvent.click(vcaJack)
    expect(onConnectionsChange).toHaveBeenCalledWith([
      expect.objectContaining({ fromJack: 'dfam:trigger_out', toJack: 'dfam:vca_cv_in' }),
    ])
  })

  it('clicking same jack twice cancels pending state', () => {
    const onConnectionsChange = jest.fn()
    const { container } = render(
      <DFAMPanel
        deviceId="DFAM"
        values={{}}
        onChange={noop}
        connections={[]}
        onConnectionsChange={onConnectionsChange}
      />
    )
    const triggerJack = container.querySelector('[data-jack="dfam:trigger_out"]')!
    fireEvent.click(triggerJack)
    fireEvent.click(triggerJack)
    expect(onConnectionsChange).not.toHaveBeenCalled()
  })

  it('does not duplicate an existing connection', () => {
    const onConnectionsChange = jest.fn()
    const existing = [{ fromJack: 'dfam:trigger_out', toJack: 'dfam:vca_cv_in', color: 'orange' }]
    const { container } = render(
      <DFAMPanel
        deviceId="DFAM"
        values={{}}
        onChange={noop}
        connections={existing}
        onConnectionsChange={onConnectionsChange}
      />
    )
    const triggerJack = container.querySelector('[data-jack="dfam:trigger_out"]')!
    const vcaJack = container.querySelector('[data-jack="dfam:vca_cv_in"]')!
    fireEvent.click(triggerJack)
    fireEvent.click(vcaJack)
    expect(onConnectionsChange).not.toHaveBeenCalled()
  })
})
