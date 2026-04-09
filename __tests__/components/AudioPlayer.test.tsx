import { render, screen, fireEvent } from '@testing-library/react'
import { AudioPlayer } from '@/components/audio/AudioPlayer'

describe('AudioPlayer', () => {
  it('renders play button', () => {
    render(<AudioPlayer src="https://example.com/patch.mp3" filename="patch.mp3" />)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })

  it('renders waveform bars', () => {
    const { container } = render(
      <AudioPlayer src="https://example.com/patch.mp3" filename="patch.mp3" />,
    )
    const bars = container.querySelectorAll('[data-bar]')
    expect(bars.length).toBe(40)
  })

  it('renders download link', () => {
    render(<AudioPlayer src="https://example.com/patch.mp3" filename="my-patch.mp3" />)
    const link = screen.getByRole('link', { name: /download/i })
    expect(link).toHaveAttribute('href', 'https://example.com/patch.mp3')
  })

  it('shows filename when provided', () => {
    render(<AudioPlayer src="https://example.com/patch.mp3" filename="my-patch.mp3" />)
    expect(screen.getByText('my-patch.mp3')).toBeInTheDocument()
  })
})
