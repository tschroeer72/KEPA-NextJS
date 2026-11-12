import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfilPage from '../page'
import axios from 'axios'
import { useAuthContext } from '@/providers/auth-context-provider'

jest.mock('axios')
jest.mock('@/providers/auth-context-provider', () => ({ useAuthContext: jest.fn() }))

const mockPost = axios.post as jest.Mock
const mockAuth = useAuthContext as jest.Mock

function fill(alt: string, neu: string, wdh: string) {
  fireEvent.change(screen.getByLabelText('Altes Passwort'), { target: { value: alt } })
  fireEvent.change(screen.getByLabelText('Neues Passwort'), { target: { value: neu } })
  fireEvent.change(screen.getByLabelText('Neues Passwort wiederholen'), { target: { value: wdh } })
}
const submit = () => fireEvent.click(screen.getByRole('button', { name: /Passwort speichern/ }))

describe('ProfilPage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockAuth.mockReturnValue({ username: 'mm', vorname: 'Max', nachname: 'Muster' })
  })

  it('shows user info', () => {
    render(<ProfilPage />)
    expect(screen.getByRole('heading', { name: 'Max Muster' })).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('mm')).toBeInTheDocument()
    expect(screen.getByText('Angemeldet')).toBeInTheDocument()
  })

  it('falls back to username when names are missing', () => {
    mockAuth.mockReturnValue({ username: 'zed', vorname: null, nachname: null })
    render(<ProfilPage />)
    expect(screen.getByRole('heading', { name: 'zed' })).toBeInTheDocument()
    expect(screen.getByText('Z')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(2)
  })

  it('falls back to "Benutzer" when nothing is known', () => {
    mockAuth.mockReturnValue({ username: null, vorname: null, nachname: null })
    render(<ProfilPage />)
    expect(screen.getByRole('heading', { name: 'Benutzer' })).toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(3)
  })

  it('disables the submit button until all fields are filled', () => {
    render(<ProfilPage />)
    expect(screen.getByRole('button', { name: /Passwort speichern/ })).toBeDisabled()
    fill('a', 'b', '')
    expect(screen.getByRole('button', { name: /Passwort speichern/ })).toBeDisabled()
    fill('a', 'b', 'b')
    expect(screen.getByRole('button', { name: /Passwort speichern/ })).toBeEnabled()
  })

  it('rejects mismatching new passwords', () => {
    render(<ProfilPage />)
    fill('alt', 'neu1', 'neu2')
    submit()
    expect(screen.getByText('Die neuen Passwörter stimmen nicht überein.')).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('rejects new password equal to old one', () => {
    render(<ProfilPage />)
    fill('gleich', 'gleich', 'gleich')
    submit()
    expect(screen.getByText('Das neue Passwort darf nicht dem alten entsprechen.')).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('changes the password, shows server message and clears the form', async () => {
    mockPost.mockResolvedValue({ data: { message: 'Geändert!' } })
    render(<ProfilPage />)
    fill('alt', 'neu', 'neu')
    submit()
    expect(await screen.findByText('Geändert!')).toBeInTheDocument()
    expect(mockPost).toHaveBeenCalledWith('/api/auth/change-password', { altesPasswort: 'alt', neuesPasswort: 'neu' })
    expect(screen.getByLabelText('Altes Passwort')).toHaveValue('')
    expect(screen.getByLabelText('Neues Passwort')).toHaveValue('')
  })

  it('shows default success message when server sends none', async () => {
    mockPost.mockResolvedValue({ data: {} })
    render(<ProfilPage />)
    fill('alt', 'neu', 'neu')
    submit()
    expect(await screen.findByText('Passwort erfolgreich geändert.')).toBeInTheDocument()
  })

  it('shows loading state while saving', async () => {
    let resolve!: (v: any) => void
    mockPost.mockReturnValue(new Promise(r => { resolve = r }))
    render(<ProfilPage />)
    fill('alt', 'neu', 'neu')
    submit()
    expect(await screen.findByRole('button', { name: 'Wird geändert...' })).toBeDisabled()
    resolve({ data: {} })
    await screen.findByText('Passwort erfolgreich geändert.')
  })

  it('shows the server error', async () => {
    mockPost.mockRejectedValue({ response: { data: { error: 'Altes Passwort falsch' } } })
    render(<ProfilPage />)
    fill('alt', 'neu', 'neu')
    submit()
    expect(await screen.findByText('Altes Passwort falsch')).toBeInTheDocument()
    expect(screen.getByLabelText('Altes Passwort')).toHaveValue('alt')
  })

  it('shows generic error when no server error is available', async () => {
    mockPost.mockRejectedValue(new Error('net'))
    render(<ProfilPage />)
    fill('alt', 'neu', 'neu')
    submit()
    await waitFor(() => expect(screen.getByText('Ein Fehler ist aufgetreten.')).toBeInTheDocument())
  })

  it('clears an old error on the next submit', async () => {
    mockPost.mockResolvedValue({ data: {} })
    render(<ProfilPage />)
    fill('alt', 'neu1', 'neu2')
    submit()
    expect(screen.getByText('Die neuen Passwörter stimmen nicht überein.')).toBeInTheDocument()
    fill('alt', 'neu', 'neu')
    submit()
    await screen.findByText('Passwort erfolgreich geändert.')
    expect(screen.queryByText('Die neuen Passwörter stimmen nicht überein.')).not.toBeInTheDocument()
  })
})
