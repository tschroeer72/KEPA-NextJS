import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MeisterschaftsStatusCard from '../meisterschafts-status-card'
import { updateMeisterschaft } from '@/app/actions/verwaltung/meisterschaften/actions'
import { toast } from 'sonner'

const push = jest.fn()
const refresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/app/actions/verwaltung/meisterschaften/actions', () => ({ updateMeisterschaft: jest.fn() }))
jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Ctx = React.createContext({})
  return {
    Select: ({ onValueChange, children }: any) => <Ctx.Provider value={{ onValueChange }}>{children}</Ctx.Provider>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const c: any = React.useContext(Ctx)
      return <button onClick={() => c.onValueChange(value)}>{children}</button>
    },
  }
})

const all = [
  { ID: 1, Bezeichnung: 'M 2024', Aktiv: 0, tblMeisterschaftstyp: { Meisterschaftstyp: 'Liga' } },
  { ID: 2, Bezeichnung: 'M 2025', Aktiv: 1, tblMeisterschaftstyp: null },
]

describe('MeisterschaftsStatusCard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows the active championship with type', () => {
    render(<MeisterschaftsStatusCard aktiveMeisterschaft={all[0]} allMeisterschaften={all} />)
    expect(screen.getByText('M 2024', { selector: '[data-slot="card-title"]' })).toBeInTheDocument()
    expect(screen.getByText('Liga', { selector: 'span.text-sm' })).toBeInTheDocument()
  })

  it('shows fallback when no active championship; unknown type label', () => {
    render(<MeisterschaftsStatusCard aktiveMeisterschaft={null} allMeisterschaften={all} />)
    expect(screen.getByText('Keine aktive Meisterschaft')).toBeInTheDocument()
    expect(screen.getByText('M 2025 (Unbekannter Typ)')).toBeInTheDocument()
  })

  it('disables Aktivieren until a selection is made', () => {
    render(<MeisterschaftsStatusCard aktiveMeisterschaft={null} allMeisterschaften={all} />)
    expect(screen.getByRole('button', { name: 'Aktivieren' })).toBeDisabled()
  })

  it('activates selected championship, toasts and refreshes', async () => {
    ;(updateMeisterschaft as jest.Mock).mockResolvedValue({ success: true })
    render(<MeisterschaftsStatusCard aktiveMeisterschaft={null} allMeisterschaften={all} />)
    fireEvent.click(screen.getByText('M 2024 (Liga)'))
    fireEvent.click(screen.getByRole('button', { name: 'Aktivieren' }))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
    expect(updateMeisterschaft).toHaveBeenCalledWith(1, { Aktiv: 1 })
    expect(toast.success).toHaveBeenCalledWith('Meisterschaft wurde aktiviert')
  })

  it('shows error from action', async () => {
    ;(updateMeisterschaft as jest.Mock).mockResolvedValue({ success: false, error: 'Fehler X' })
    render(<MeisterschaftsStatusCard aktiveMeisterschaft={null} allMeisterschaften={all} />)
    fireEvent.click(screen.getByText('M 2024 (Liga)'))
    fireEvent.click(screen.getByRole('button', { name: 'Aktivieren' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler X'))
    expect(refresh).not.toHaveBeenCalled()
  })

  it('shows generic error when action throws, and navigates', async () => {
    ;(updateMeisterschaft as jest.Mock).mockRejectedValue(new Error('x'))
    render(<MeisterschaftsStatusCard aktiveMeisterschaft={null} allMeisterschaften={all} />)
    fireEvent.click(screen.getByText('M 2024 (Liga)'))
    fireEvent.click(screen.getByRole('button', { name: 'Aktivieren' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Ein unerwarteter Fehler ist aufgetreten'))
    fireEvent.click(screen.getByRole('button', { name: 'Zur Meisterschaftsseite' }))
    expect(push).toHaveBeenCalledWith('/verwaltung/meisterschaften')
  })
})
