import { render, screen, fireEvent } from '@testing-library/react'
import AppBar from '../app-bar'
import { useAuthContext } from '@/providers/auth-context-provider'
import { NavData } from '@/data/navdata'

jest.mock('@/providers/auth-context-provider', () => ({
  useAuthContext: jest.fn(),
}))

// Mock ThemeSwitcher to avoid complex setup
jest.mock('@/components/theme-switcher', () => {
  return function MockThemeSwitcher() {
    return <div data-testid="theme-switcher">ThemeSwitcher</div>
  }
})

describe('AppBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthContext as jest.Mock).mockReturnValue({
      isLogin: false,
    })
  })

  it('renders the title and links to home', () => {
    render(<AppBar />)
    const titleLink = screen.getByText(/Kegelgruppe KEPA 1958/i).closest('a')
    expect(titleLink).toHaveAttribute('href', '/')
  })

  it('renders navigation items from NavData', () => {
    render(<AppBar />)
    NavData.forEach((item) => {
      const links = screen.getAllByText(item.title)
      expect(links.length).toBeGreaterThan(0)
      expect(links[0].closest('a')).toHaveAttribute('href', item.href)
    })
  })

  it('shows Login when not logged in', () => {
    render(<AppBar />)
    const loginLinks = screen.getAllByText(/Login/i)
    expect(loginLinks.length).toBeGreaterThan(0)
    expect(loginLinks[0].closest('a')).toHaveAttribute('href', '/login')
  })

  it('shows Verwaltung when logged in', () => {
    ;(useAuthContext as jest.Mock).mockReturnValue({
      isLogin: true,
    })
    render(<AppBar />)
    const verwaltungLinks = screen.getAllByText(/Verwaltung/i)
    expect(verwaltungLinks.length).toBeGreaterThan(0)
    expect(verwaltungLinks[0].closest('a')).toHaveAttribute('href', '/verwaltung')
  })

  it('toggles mobile menu when button is clicked', () => {
    render(<AppBar />)
    const toggleButton = screen.getByLabelText(/Toggle mobile menu/i)
    
    // Initial state: mobile menu should not be visible or at least home link in mobile menu not present
    // Actually it's rendered conditionally
    expect(screen.queryByRole('nav')).not.toBeInTheDocument()
    
    fireEvent.click(toggleButton)
    
    // After click, mobile menu should be visible
    // The mobile menu uses a <nav> tag
    const navs = screen.getAllByRole('navigation')
    // One is for desktop (NavigationMenu), one is for mobile
    expect(navs.length).toBeGreaterThan(1)
  })
})
