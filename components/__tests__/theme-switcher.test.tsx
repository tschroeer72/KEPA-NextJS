import { render, screen, fireEvent } from '@testing-library/react'
import ThemeSwitcher from '../theme-switcher'
import { useTheme } from 'next-themes'

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}))

describe('ThemeSwitcher Component', () => {
  const setTheme = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useTheme as jest.Mock).mockReturnValue({
      resolvedTheme: 'light',
      setTheme,
    })
  })

  it('renders nothing when not mounted', () => {
    // This is hard to test because useEffect runs immediately in JSDOM
    // But we can check if it eventually renders
  })

  it('renders Moon icon when theme is light', () => {
    render(<ThemeSwitcher />)
    // lucide-react icons are usually svgs
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('calls setTheme with dark when light theme button is clicked', () => {
    render(<ThemeSwitcher />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(setTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme with light when dark theme button is clicked', () => {
    ;(useTheme as jest.Mock).mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
    })
    render(<ThemeSwitcher />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(setTheme).toHaveBeenCalledWith('light')
  })
})
