import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatchForm } from '@/components/patch-form/PatchForm'
import { VisibilityToggle } from '@/components/ui/VisibilityToggle'
import type { PatchFormValues } from '@/lib/types'

jest.mock('@/components/dfam/DFAMPanel', () => ({
  DFAMPanel: ({
    onChange,
    onConnectionsChange,
  }: {
    onChange: (v: Record<string, number>) => void
    onConnectionsChange: (c: unknown[]) => void
  }) => (
    <div
      data-testid="dfam-panel"
      onClick={() => {
        onChange({ tempo: 7 })
        onConnectionsChange([])
      }}
    />
  ),
}))

jest.mock('@/components/dfam/PatchBay', () => ({
  PatchBay: ({ onChange }: { onChange: (c: unknown[]) => void }) => (
    <div data-testid="patch-bay" onClick={() => onChange([])} />
  ),
}))

const defaultValues: PatchFormValues = {
  name: '',
  description: '',
  devices: ['DFAM'],
  tags: [],
  knobSettings: { DFAM: {} },
  connections: [],
  sequenceNotes: '',
  audioUrl: '',
  isPublic: false,
}

describe('PatchForm', () => {
  it('renders name input', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByPlaceholderText(/patch name/i)).toBeInTheDocument()
  })

  it('renders device checkboxes', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByLabelText('DFAM')).toBeInTheDocument()
    expect(screen.getByLabelText('XFAM')).toBeInTheDocument()
  })

  it('renders dfam panel when DFAM is selected', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByTestId('dfam-panel')).toBeInTheDocument()
  })

  it('renders patch bay section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/patch bay/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct devices', () => {
    const onSubmit = jest.fn()
    render(<PatchForm defaultValues={defaultValues} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/patch name/i), { target: { value: 'My Patch' } })
    fireEvent.click(screen.getByText(/save patch/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ devices: ['DFAM'] }))
  })
})

describe('VisibilityToggle', () => {
  it('shows "private" when value is false', () => {
    render(<VisibilityToggle value={false} onChange={() => {}} />)
    expect(screen.getByText('private')).toBeInTheDocument()
  })

  it('shows "public" when value is true', () => {
    render(<VisibilityToggle value={true} onChange={() => {}} />)
    expect(screen.getByText('public')).toBeInTheDocument()
  })

  it('calls onChange with toggled value on click', async () => {
    const onChange = jest.fn()
    const user = userEvent.setup()
    render(<VisibilityToggle value={false} onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
