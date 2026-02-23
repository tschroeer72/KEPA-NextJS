import { render, screen } from '@testing-library/react'
import ConditionalLayout from '../conditional-layout'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock AppBar and AppBarVerwaltung
jest.mock('@/components/app-bar', () => {
  return function MockAppBar() {
    return <div data-testid="app-bar">AppBar</div>
  }
})
jest.mock('@/components/app-bar-verwaltung', () => {
  return function MockAppBarVerwaltung() {
    return <div data-testid="app-bar-verwaltung">AppBarVerwaltung</div>
  }
})
jest.mock('@/components/footer', () => {
  return function MockFooter() {
    return <div data-testid="footer">Footer</div>
  }
})

describe('ConditionalLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders normal layout for non-verwaltung paths', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/')
    render(
      <ConditionalLayout>
        <div>Content</div>
      </ConditionalLayout>
    )
    expect(screen.getByTestId('app-bar')).toBeInTheDocument()
    expect(screen.queryByTestId('app-bar-verwaltung')).not.toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('renders verwaltung layout for /verwaltung paths', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/verwaltung/dashboard')
    render(
      <ConditionalLayout>
        <div>Verwaltung Content</div>
      </ConditionalLayout>
    )
    expect(screen.getByTestId('app-bar-verwaltung')).toBeInTheDocument()
    expect(screen.queryByTestId('app-bar')).not.toBeInTheDocument()
    expect(screen.getByText('Verwaltung Content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })
})
