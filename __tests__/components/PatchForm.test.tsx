import { render, screen, fireEvent } from '@testing-library/react'
import { PatchForm } from '@/components/patch-form/PatchForm'
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
}

describe('PatchForm', () => {
  it('renders name input', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByPlaceholderText(/patch name/i)).toBeInTheDocument()
  })

  it('renders knob settings section', () => {
    render(<PatchForm defaultValues={defaultValues} onSubmit={jest.fn()} />)
    expect(screen.getByText(/knob settings/i)).toBeInTheDocument()
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
