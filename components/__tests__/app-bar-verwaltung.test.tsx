import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AppBarVerwaltung from '../app-bar-verwaltung'
import { useAuthContext } from '@/providers/auth-context-provider'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { NavDataVerwaltung } from '@/data/navdata-verwaltung'

jest.mock('@/providers/auth-context-provider', () => ({
  useAuthContext: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('axios')

// Mock ThemeSwitcher
jest.mock('@/components/theme-switcher', () => {
  return function MockThemeSwitcher() {
    return <div data-testid="theme-switcher">ThemeSwitcher</div>
  }
})

// Mock UI components
jest.mock("@/components/ui/navigation-menu", () => ({
  NavigationMenu: ({ children }: any) => <div>{children}</div>,
  NavigationMenuList: ({ children }: any) => <div>{children}</div>,
  NavigationMenuItem: ({ children }: any) => <div>{children}</div>,
  NavigationMenuLink: ({ children }: any) => <div>{children}</div>,
  NavigationMenuTrigger: ({ children }: any) => <button>{children}</button>,
  NavigationMenuContent: ({ children }: any) => <div>{children}</div>,
}))

describe('AppBarVerwaltung Component', () => {
  const setIsLogin = jest.fn()
  const setUserId = jest.fn()
  const setUsername = jest.fn()
  const setVorname = jest.fn()
  const setNachname = jest.fn()
  const setIsAdmin = jest.fn()
  const push = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthContext as jest.Mock).mockReturnValue({
      setIsLogin,
      userId: 1,
      setUserId,
      username: 'testuser',
      setUsername,
      vorname: 'Test',
      nachname: 'User',
      setVorname,
      setNachname,
      isAdmin: false,
      setIsAdmin,
    })
    ;(useRouter as jest.Mock).mockReturnValue({ push })
  })

  it('renders the title and links to home', () => {
    render(<AppBarVerwaltung />)
    const titleLink = screen.getByText(/Kegelgruppe KEPA 1958/i).closest('a')
    expect(titleLink).toHaveAttribute('href', '/')
  })

  it('renders navigation items from NavDataVerwaltung', () => {
    render(<AppBarVerwaltung />)
    NavDataVerwaltung.forEach((item) => {
      const links = screen.getAllByText(item.title)
      expect(links.length).toBeGreaterThan(0)
    })
  })

  it('renders user name in the menu', () => {
    render(<AppBarVerwaltung />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('handles logout correctly', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({ status: 200 })
    render(<AppBarVerwaltung />)
    
    // On mobile or desktop? Let's check mobile first as it's easier to find the button if we open it
    const logoutButtons = screen.getAllByText(/Logout/i)
    fireEvent.click(logoutButtons[0])

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/logout')
      expect(setIsLogin).toHaveBeenCalledWith(false)
      expect(push).toHaveBeenCalledWith('/')
    }, { timeout: 2000 })
  })

  it('shows admin links when user is admin', () => {
    ;(useAuthContext as jest.Mock).mockReturnValue({
      setIsLogin,
      userId: 1,
      setUserId,
      username: 'admin',
      setUsername,
      vorname: 'Admin',
      nachname: 'User',
      setVorname,
      setNachname,
      isAdmin: true,
      setIsAdmin,
    })
    render(<AppBarVerwaltung />)
    // Benutzerzugriff is an admin link
    expect(screen.getAllByText(/Benutzerzugriff/i).length).toBeGreaterThan(0)
  })
})
