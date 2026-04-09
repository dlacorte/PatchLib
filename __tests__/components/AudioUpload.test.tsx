import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AudioUpload } from '@/components/audio/AudioUpload'

global.fetch = jest.fn()

describe('AudioUpload', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders attach button when no value', () => {
    render(<AudioUpload value="" onChange={jest.fn()} />)
    expect(screen.getByText(/attach mp3/i)).toBeInTheDocument()
    expect(screen.getByText(/max 10 mb/i)).toBeInTheDocument()
  })

  it('shows error for files over 10 MB', async () => {
    render(<AudioUpload value="" onChange={jest.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const bigFile = new File(['x'], 'big.mp3', { type: 'audio/mpeg' })
    Object.defineProperty(bigFile, 'size', { value: 11 * 1024 * 1024 })
    fireEvent.change(input, { target: { files: [bigFile] } })
    await waitFor(() => expect(screen.getByText(/10 mb/i)).toBeInTheDocument())
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows error for non-MP3 files', async () => {
    render(<AudioUpload value="" onChange={jest.fn()} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const wavFile = new File(['data'], 'sound.wav', { type: 'audio/wav' })
    fireEvent.change(input, { target: { files: [wavFile] } })
    await waitFor(() => expect(screen.getByText(/mp3/i)).toBeInTheDocument())
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('calls onChange with publicUrl after successful upload', async () => {
    const onChange = jest.fn()
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          uploadUrl: 'https://s3.example.com/put',
          publicUrl: 'https://patchlib-audio.s3.amazonaws.com/audio/abc.mp3',
        }),
      })
      .mockResolvedValueOnce({ ok: true })

    render(<AudioUpload value="" onChange={onChange} />)
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['mp3data'], 'patch.mp3', { type: 'audio/mpeg' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        'https://patchlib-audio.s3.amazonaws.com/audio/abc.mp3',
      ),
    )
  })

  it('renders mini player when value is set', () => {
    render(
      <AudioUpload
        value="https://patchlib-audio.s3.amazonaws.com/audio/abc.mp3"
        onChange={jest.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('calls onChange with empty string when removed', async () => {
    const onChange = jest.fn()
    render(
      <AudioUpload
        value="https://patchlib-audio.s3.amazonaws.com/audio/abc.mp3"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
