import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import BenutzerzugriffPage from '../page'
import { useAuthContext } from '@/providers/auth-context-provider'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

jest.mock('@/providers/auth-context-provider', () => ({ useAuthContext: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('axios')
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const mitglieder = [
  { ID: 1, Vorname: 'Max', Nachname: 'Zander', Login: 'max', Password: 'pw1' },
  { ID: 2, Vorname: 'Anna', Nachname: 'Berg', Login: null, Password: null },
  { ID: 3, Vorname: 'Carl', Nachname: 'Adam', Login: 'carl', Password: 'pw3' },
]

const rowNames = () =>
  screen.getAllByRole('row').slice(1).map(r => within(r).getAllByRole('cell')[0].textContent)

describe('BenutzerzugriffPage (Interaktionen)', () => {
  const push = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(useRouter as jest.Mock).mockReturnValue({ push })
    ;(useAuthContext as jest.Mock).mockReturnValue({ isLogin: true, isAdmin: true })
    ;(axios.get as jest.Mock).mockResolvedValue({ data: mitglieder })
  })
  afterEach(() => jest.restoreAllMocks())

  it('redirects to start page when not logged in and does not fetch', async () => {
    ;(useAuthContext as jest.Mock).mockReturnValue({ isLogin: false, isAdmin: false })
    render(<BenutzerzugriffPage />)
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('shows loader while loading', async () => {
    ;(axios.get as jest.Mock).mockReturnValue(new Promise(() => {}))
    const { container } = render(<BenutzerzugriffPage />)
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows empty table when loading fails', async () => {
    ;(axios.get as jest.Mock).mockRejectedValue(new Error('x'))
    render(<BenutzerzugriffPage />)
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })

  it('shows "kein Zugriff" and Aktivieren for members without login', async () => {
    render(<BenutzerzugriffPage />)
    expect(await screen.findByText('kein Zugriff')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Aktivieren/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Deaktivieren/ })).toHaveLength(2)
  })

  it('filters by Nachname, Vorname and Login', async () => {
    render(<BenutzerzugriffPage />)
    await screen.findByText('Zander')
    fireEvent.change(screen.getByPlaceholderText('Nachname filtern...'), { target: { value: 'ber' } })
    expect(rowNames()).toEqual(['Berg'])
    fireEvent.change(screen.getByPlaceholderText('Nachname filtern...'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText('Vorname filtern...'), { target: { value: 'CARL' } })
    expect(rowNames()).toEqual(['Adam'])
    fireEvent.change(screen.getByPlaceholderText('Vorname filtern...'), { target: { value: '' } })
    fireEvent.change(screen.getByPlaceholderText('Login filtern...'), { target: { value: 'ma' } })
    expect(rowNames()).toEqual(['Zander'])
  })

  it('sorts ascending, then descending, by column header', async () => {
    render(<BenutzerzugriffPage />)
    await screen.findByText('Zander')
    expect(rowNames()).toEqual(['Zander', 'Berg', 'Adam'])
    fireEvent.click(screen.getByText('Nachname'))
    expect(rowNames()).toEqual(['Adam', 'Berg', 'Zander'])
    fireEvent.click(screen.getByText('Nachname'))
    expect(rowNames()).toEqual(['Zander', 'Berg', 'Adam'])
    fireEvent.click(screen.getByText('Vorname'))
    expect(rowNames()).toEqual(['Berg', 'Adam', 'Zander']) // Anna, Carl, Max
    fireEvent.click(screen.getByText('Login'))
    expect(rowNames()[0]).toBe('Berg') // leerer Login zuerst
  })

  it('activates a member (edit mode with empty values) and cancels', async () => {
    render(<BenutzerzugriffPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Aktivieren/ }))
    expect(screen.getByPlaceholderText('Login')).toHaveValue('')
    expect(screen.getByPlaceholderText('Neues Passwort')).toHaveValue('')
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(screen.queryByPlaceholderText('Login')).not.toBeInTheDocument()
  })

  it('saves edited credentials, reloads and shows success toast', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({})
    render(<BenutzerzugriffPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Aktivieren/ }))
    fireEvent.change(screen.getByPlaceholderText('Login'), { target: { value: 'anna' } })
    fireEvent.change(screen.getByPlaceholderText('Neues Passwort'), { target: { value: 'geheim' } })
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Änderungen erfolgreich gespeichert'))
    expect(axios.post).toHaveBeenCalledWith('/api/verwaltung/benutzerzugriff', {
      id: 2, login: 'anna', passwort: 'geheim', action: 'speichern',
    })
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2))
    expect(screen.queryByPlaceholderText('Login')).not.toBeInTheDocument()
  })

  it('shows error toast and stays in edit mode when saving fails', async () => {
    ;(axios.post as jest.Mock).mockRejectedValue(new Error('x'))
    render(<BenutzerzugriffPage />)
    fireEvent.click(await screen.findByRole('button', { name: /Aktivieren/ }))
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Speichern fehlgeschlagen'))
    expect(screen.getByPlaceholderText('Login')).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('deactivates after confirmation in the dialog', async () => {
    ;(axios.post as jest.Mock).mockResolvedValue({})
    render(<BenutzerzugriffPage />)
    await screen.findByText('Zander')
    fireEvent.click(screen.getAllByRole('button', { name: /Deaktivieren/ })[0])
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Sind Sie sicher?')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Deaktivieren' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Benutzerzugriff deaktiviert'))
    expect(axios.post).toHaveBeenCalledWith('/api/verwaltung/benutzerzugriff', { id: 1, action: 'deaktivieren' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('does not call the API when the dialog is cancelled', async () => {
    render(<BenutzerzugriffPage />)
    await screen.findByText('Zander')
    fireEvent.click(screen.getAllByRole('button', { name: /Deaktivieren/ })[0])
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Abbrechen' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('shows error toast when deactivation fails', async () => {
    ;(axios.post as jest.Mock).mockRejectedValue(new Error('x'))
    render(<BenutzerzugriffPage />)
    await screen.findByText('Zander')
    fireEvent.click(screen.getAllByRole('button', { name: /Deaktivieren/ })[0])
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Deaktivieren' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Deaktivierung fehlgeschlagen'))
  })
})
