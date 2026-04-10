import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PatchForm } from '@/components/patch-form/PatchForm'
import { VisibilityToggle } from '@/components/ui/VisibilityToggle'
import type { PatchFormValues } from '@/lib/types'

// Mock heavy child components to keep tests fast
jest.mock('@/components/dfam/KnobGrid', () => ({
  KnobGrid: ({ onChange }: { onChange: (v: Record<string, number>) => void }) => (
    <div data-testid="knob-grid" onClick={() => onChange({ tempo: 7 })} />
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
  tags: [],
  knobSettings: {},
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

  it('renders sound engine section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/sound engine/i)).toBeInTheDocument()
  })

  it('renders patch bay section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/patch bay/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct name when saved', () => {
    const onSubmit = jest.fn()
    render(<PatchForm defaultValues={defaultValues} onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText(/patch name/i), { target: { value: 'My Patch' } })
    fireEvent.click(screen.getByText(/save patch/i))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Patch' }))
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
