import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmailEntwickler } from '../email-entwickler'
import { getMembersForEmail } from '@/app/actions/verwaltung/email/actions'
import { toast } from 'sonner'

jest.mock('@/app/actions/verwaltung/email/actions', () => ({
  getMembersForEmail: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/providers/auth-context-provider', () => ({
  useAuthContext: () => ({ vorname: 'Max', nachname: 'Muster' }),
}))

const mockMembers = getMembersForEmail as jest.Mock
const origFetch = global.fetch

const members = [
  { ID: 1, Vorname: 'Anna', Nachname: 'A', EMail: ' anna@x.de ' },
  { ID: 2, Vorname: 'Ben', Nachname: 'B', EMail: null },
  { ID: 3, Vorname: 'Cem', Nachname: 'C', EMail: 'ohne-at' },
  { ID: 4, Vorname: 'Dora', Nachname: 'D', EMail: 'dora@x.de' },
]

describe('EmailEntwickler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMembers.mockResolvedValue({ success: true, data: members })
  })
  afterEach(() => {
    global.fetch = origFetch
  })

  it('lists only members with valid email addresses (trimmed)', async () => {
    render(<EmailEntwickler />)
    expect(await screen.findByText('Anna A')).toBeInTheDocument()
    expect(screen.getByText('anna@x.de')).toBeInTheDocument()
    expect(screen.getByText('Dora D')).toBeInTheDocument()
    expect(screen.queryByText('Ben B')).not.toBeInTheDocument()
    expect(screen.queryByText('Cem C')).not.toBeInTheDocument()
  })

  it('shows toast when loading CC recipients fails', async () => {
    mockMembers.mockResolvedValue({ success: false, error: 'Nope' })
    render(<EmailEntwickler />)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Nope'))
  })

  it('shows default toast when result has no error text', async () => {
    mockMembers.mockResolvedValue({ success: false })
    render(<EmailEntwickler />)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Laden der CC-Empfänger'))
  })

  it('shows network toast when loading throws', async () => {
    mockMembers.mockRejectedValue(new Error('x'))
    render(<EmailEntwickler />)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Netzwerkfehler beim Laden der CC-Empfänger'))
  })

  it('validates that subject and message are filled', async () => {
    global.fetch = jest.fn() as any
    render(<EmailEntwickler />)
    await screen.findByText('Anna A')
    fireEvent.click(screen.getByRole('button', { name: /Versenden/ }))
    expect(toast.error).toHaveBeenCalledWith('Betreff und Nachricht müssen gefüllt sein!')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sends mail with reason, selected CC and footer, then clears the form', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as any
    render(<EmailEntwickler />)
    await screen.findByText('Anna A')

    fireEvent.click(screen.getByLabelText('Wunsch'))
    fireEvent.click(screen.getByText('Anna A')) // toggelt CC an
    fireEvent.click(screen.getByText('Dora D'))
    fireEvent.click(screen.getByText('Dora D')) // und wieder ab
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'Hallo' } })
    fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'Text' } })
    fireEvent.click(screen.getByRole('button', { name: /Versenden/ }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Mail wurde versendet'))
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/email/send-error')
    const body = JSON.parse(opts.body)
    expect(body).toEqual(expect.objectContaining({
      cc: ['anna@x.de'],
      subject: 'Hallo',
      type: 'Wunsch',
    }))
    expect(body.message).toContain('Text')
    expect(body.message).toContain('Gesendet von: Max Muster')
    expect(screen.getByLabelText('Betreff')).toHaveValue('')
    expect(screen.getByLabelText('Nachricht')).toHaveValue('')
  })

  it('shows server error message', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'SMTP down' }) }) as any
    render(<EmailEntwickler />)
    await screen.findByText('Anna A')
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'N' } })
    fireEvent.click(screen.getByRole('button', { name: /Versenden/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('SMTP down'))
    expect(screen.getByLabelText('Betreff')).toHaveValue('B')
  })

  it('shows default error when server gives no message', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as any
    render(<EmailEntwickler />)
    await screen.findByText('Anna A')
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'N' } })
    fireEvent.click(screen.getByRole('button', { name: /Versenden/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Versenden der E-Mail'))
  })

  it('shows network error toast when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as any
    render(<EmailEntwickler />)
    await screen.findByText('Anna A')
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'N' } })
    fireEvent.click(screen.getByRole('button', { name: /Versenden/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Netzwerkfehler beim Versenden der E-Mail'))
  })
})
