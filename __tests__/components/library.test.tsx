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
  devices: ['DFAM'],
  description: 'Deep kick',
  tags: ['percussion', 'kick'],
  createdAt: new Date('2026-04-08'),
  updatedAt: new Date('2026-04-08'),
  sequenceNotes: null,
  audioUrl: null,
  photoUrl: null,
  isPublic: false,
  userId: 'u1',
  _count: { connections: 2 },
  user: { displayName: null, email: 'test@test.com' },
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

  it('shows ♪ indicator when patch has audio', () => {
    render(<PatchCard patch={{ ...mockPatch, audioUrl: 'https://example.com/patch.mp3' }} />)
    expect(screen.getByText('♪')).toBeInTheDocument()
  })

  it('does not show ♪ indicator when patch has no audio', () => {
    render(<PatchCard patch={{ ...mockPatch, audioUrl: null }} />)
    expect(screen.queryByText('♪')).not.toBeInTheDocument()
  })
})

describe('PatchCard — discovery variant', () => {
  it('shows owner label "by janko" when displayName is set', () => {
    render(<PatchCard patch={{ ...mockPatch, user: { displayName: 'janko', email: 'janko@test.com' } }} variant="discovery" />)
    expect(screen.getByText(/by janko/i)).toBeInTheDocument()
  })

  it('falls back to email prefix when displayName is null', () => {
    render(<PatchCard patch={{ ...mockPatch, user: { displayName: null, email: 'someone@test.com' } }} variant="discovery" />)
    expect(screen.getByText(/by someone/i)).toBeInTheDocument()
  })
})

describe('PatchCard — library variant', () => {
  it('shows "public" badge when isPublic is true', () => {
    render(<PatchCard patch={{ ...mockPatch, isPublic: true }} variant="library" />)
    expect(screen.getByText('public')).toBeInTheDocument()
  })

  it('shows "private" badge when isPublic is false', () => {
    render(<PatchCard patch={{ ...mockPatch, isPublic: false }} variant="library" />)
    expect(screen.getByText('private')).toBeInTheDocument()
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
