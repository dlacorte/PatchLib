import { render, screen } from '@testing-library/react'
import { PanelStack } from '@/components/dfam/PanelStack'
import type { Device } from '@/lib/types'

jest.mock('@/components/dfam/DFAMPanel', () => ({
  DFAMPanel: ({ deviceId }: { deviceId: string }) => (
    <div data-testid={`panel-${deviceId}`}>{deviceId}</div>
  ),
}))

const noop = () => {}

describe('PanelStack', () => {
  it('renders one panel per device', () => {
    render(
      <PanelStack
        devices={['DFAM', 'XFAM'] as Device[]}
        knobSettings={{ DFAM: {}, XFAM: {} }}
        connections={[]}
        onChange={noop}
        onConnectionsChange={noop}
      />
    )
    expect(screen.getByTestId('panel-DFAM')).toBeInTheDocument()
    expect(screen.getByTestId('panel-XFAM')).toBeInTheDocument()
  })

  it('renders a single panel when only one device', () => {
    render(
      <PanelStack
        devices={['DFAM'] as Device[]}
        knobSettings={{ DFAM: {} }}
        connections={[]}
        onChange={noop}
        onConnectionsChange={noop}
      />
    )
    expect(screen.getByTestId('panel-DFAM')).toBeInTheDocument()
    expect(screen.queryByTestId('panel-XFAM')).not.toBeInTheDocument()
  })

  it('renders a bridge SVG line for a cross-device connection', () => {
    const crossConn = { fromJack: 'dfam:trigger_out', toJack: 'xfam:vca_cv_in', color: 'orange' }
    const { container } = render(
      <PanelStack
        devices={['DFAM', 'XFAM'] as Device[]}
        knobSettings={{ DFAM: {}, XFAM: {} }}
        connections={[crossConn]}
        onChange={noop}
        onConnectionsChange={noop}
      />
    )
    const bridgeLine = container.querySelector('line[data-bridge]')
    expect(bridgeLine).not.toBeNull()
  })

  it('does not render bridge lines when no cross-device connections', () => {
    const { container } = render(
      <PanelStack
        devices={['DFAM', 'XFAM'] as Device[]}
        knobSettings={{ DFAM: {}, XFAM: {} }}
        connections={[]}
        onChange={noop}
        onConnectionsChange={noop}
      />
    )
    const bridgeLine = container.querySelector('line[data-bridge]')
    expect(bridgeLine).toBeNull()
  })
})
