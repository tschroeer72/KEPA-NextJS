import { render, screen } from '@testing-library/react'
import VerwaltungGuard from '../verwaltung-guard'
import { useAuthContext } from '@/providers/auth-context-provider'
import { usePathname, useRouter } from 'next/navigation'

jest.mock('@/providers/auth-context-provider', () => ({ useAuthContext: jest.fn() }))
jest.mock('next/navigation', () => ({ usePathname: jest.fn(), useRouter: jest.fn() }))

const push = jest.fn()

function setup(auth: { isLogin: boolean; isFilmeUser: boolean }, path: string) {
  ;(useAuthContext as jest.Mock).mockReturnValue(auth)
  ;(usePathname as jest.Mock).mockReturnValue(path)
  ;(useRouter as jest.Mock).mockReturnValue({ push })
  render(<VerwaltungGuard><p>Inhalt</p></VerwaltungGuard>)
}

describe('VerwaltungGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('always renders children', () => {
    setup({ isLogin: true, isFilmeUser: true }, '/verwaltung/mitglieder')
    expect(screen.getByText('Inhalt')).toBeInTheDocument()
  })

  it('redirects the Filme user away from other verwaltung pages', () => {
    setup({ isLogin: true, isFilmeUser: true }, '/verwaltung/mitglieder')
    expect(push).toHaveBeenCalledWith('/verwaltung/kegelfahrten')
  })

  it('does not redirect the Filme user on kegelfahrten pages and sub pages', () => {
    setup({ isLogin: true, isFilmeUser: true }, '/verwaltung/kegelfahrten/filme')
    expect(push).not.toHaveBeenCalled()
  })

  it('does not redirect regular logged-in users', () => {
    setup({ isLogin: true, isFilmeUser: false }, '/verwaltung/mitglieder')
    expect(push).not.toHaveBeenCalled()
  })

  it('does not redirect when not logged in', () => {
    setup({ isLogin: false, isFilmeUser: true }, '/verwaltung/mitglieder')
    expect(push).not.toHaveBeenCalled()
  })
})
