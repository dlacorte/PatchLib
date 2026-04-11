import { render, fireEvent } from '@testing-library/react'
import { CableSVG } from '@/components/dfam/CableSVG'

const noop = () => {}

const dfamConn = { fromJack: 'dfam:trigger_out', toJack: 'dfam:vca_cv_in', color: 'orange' }
const crossConn = { fromJack: 'dfam:trigger_out', toJack: 'xfam:vca_cv_in', color: 'blue' }

describe('CableSVG', () => {
  it('renders 24 jack overlay circles for DFAM', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const circles = container.querySelectorAll('circle[data-jack]')
    expect(circles).toHaveLength(24)
  })

  it('renders a cable path for a same-device connection', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[dfamConn]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const paths = container.querySelectorAll('path[data-cable]')
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })

  it('does not render a full cable path for a cross-device connection', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[crossConn]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const fullCables = container.querySelectorAll('path[data-cable="full"]')
    expect(fullCables).toHaveLength(0)
  })

  it('renders half-cable exit path for cross-device connection when this device is source', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[crossConn]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const exits = container.querySelectorAll('path[data-cable="exit"]')
    expect(exits).toHaveLength(1)
  })

  it('calls onJackClick with prefixed jack ID when jack circle is clicked', () => {
    const onJackClick = jest.fn()
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={onJackClick}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const triggerCircle = container.querySelector('[data-jack="dfam:trigger_out"]')!
    fireEvent.click(triggerCircle)
    expect(onJackClick).toHaveBeenCalledWith('dfam:trigger_out')
  })

  it('calls onCableSelect with connection index when hit area is clicked', () => {
    const onCableSelect = jest.fn()
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[dfamConn]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={onCableSelect}
          onCableDelete={noop}
        />
      </svg>
    )
    const hitArea = container.querySelector('path[data-cable-hit]')!
    fireEvent.click(hitArea)
    expect(onCableSelect).toHaveBeenCalledWith(0)
  })

  it('shows pending glow circle when pendingJack matches a jack', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[]}
          pendingJack="dfam:trigger_out"
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const glows = container.querySelectorAll('circle[data-pending]')
    expect(glows).toHaveLength(1)
  })

  it('renders cable in red when selected', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[dfamConn]}
          pendingJack={null}
          selectedCable={0}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
        />
      </svg>
    )
    const visualCable = container.querySelector('path[data-cable="full"]')!
    expect(visualCable.getAttribute('stroke')).toBe('#ef4444')
  })

  it('does not render jack circles when readonly=true', () => {
    const { container } = render(
      <svg>
        <CableSVG
          deviceId="DFAM"
          connections={[]}
          pendingJack={null}
          selectedCable={null}
          selectedColor="orange"
          onJackClick={noop}
          onCableSelect={noop}
          onCableDelete={noop}
          readonly
        />
      </svg>
    )
    const jackCircles = container.querySelectorAll('circle[data-jack]')
    expect(jackCircles).toHaveLength(0)
  })
})
