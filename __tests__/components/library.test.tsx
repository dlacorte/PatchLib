import { render, screen } from '@testing-library/react'
import { PatchCard } from '@/components/library/PatchCard'
import { SearchBar } from '@/components/library/SearchBar'
import { TagFilter } from '@/components/library/TagFilter'

// Mock Next.js navigation hooks used by SearchBar and TagFilter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

const mockPatch = {
  id: 'cl123',
  name: 'Heavy Kick',
  device: 'DFAM',
  description: 'Deep kick',
  tags: ['percussion', 'kick'],
  createdAt: new Date('2026-04-08'),
  updatedAt: new Date('2026-04-08'),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  _count: { connections: 2 },
}

describe('PatchCard', () => {
  it('renders patch name', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText('Heavy Kick')).toBeInTheDocument()
  })

  it('renders device name', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText('DFAM')).toBeInTheDocument()
  })

  it('renders connection count', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText(/2 cables/)).toBeInTheDocument()
  })

  it('renders tags', () => {
    render(<PatchCard patch={mockPatch} />)
    expect(screen.getByText('percussion')).toBeInTheDocument()
  })
})

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar defaultValue="" />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})

describe('TagFilter', () => {
  it('renders all tag chips', () => {
    render(<TagFilter tags={['bass', 'kick']} activeTags={[]} />)
    expect(screen.getByText('bass')).toBeInTheDocument()
    expect(screen.getByText('kick')).toBeInTheDocument()
  })

  it('marks active tags with orange styling', () => {
    const { container } = render(<TagFilter tags={['bass', 'kick']} activeTags={['bass']} />)
    const bassLink = screen.getByText('bass').closest('a')
    expect(bassLink?.className).toMatch(/orange/)
  })
})
