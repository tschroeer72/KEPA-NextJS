import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../page'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/providers/auth-context-provider'
import axios from 'axios'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/providers/auth-context-provider', () => ({
  useAuthContext: jest.fn(),
}))

jest.mock('axios')

describe('Login Page', () => {
  const push = jest.fn()
  const setIsLogin = jest.fn()
  const setUserId = jest.fn()
  const setUsername = jest.fn()
  const setVorname = jest.fn()
  const setNachname = jest.fn()
  const setIsAdmin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push })
    ;(useAuthContext as jest.Mock).mockReturnValue({
      setIsLogin,
      setUserId,
      setUsername,
      setVorname,
      setNachname,
      setIsAdmin,
    })
  })

  it('renders login form', () => {
    render(<Login />)
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Benutzername/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Passwort/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    jest.useFakeTimers()
    ;(axios.post as jest.Mock).mockResolvedValue({
      data: {
        userId: 1,
        username: 'testuser',
        vorname: 'Test',
        nachname: 'User',
        isAdmin: false
      }
    })

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/Benutzername/i), { target: { value: 'testuser' } })
    fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'password' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }))

    // Advance timers to handle the 200ms delay in Login component
    jest.advanceTimersByTime(200)

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/login', {
        benutzer: 'testuser',
        passwort: 'password'
      }, expect.any(Object))
      expect(setIsLogin).toHaveBeenCalledWith(true)
      expect(push).toHaveBeenCalledWith('/verwaltung')
    }, { timeout: 1000 })
    
    jest.useRealTimers()
  })

  it('shows error message on failed login', async () => {
    ;(axios.post as jest.Mock).mockRejectedValue(new Error('Unauthorized'))

    render(<Login />)
    
    fireEvent.change(screen.getByLabelText(/Benutzername/i), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText(/Passwort/i), { target: { value: 'wrong' } })
    
    fireEvent.click(screen.getByRole('button', { name: /Anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/Login fehlgeschlagen/i)).toBeInTheDocument()
    })
  })
})
