import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RundEmail } from '../rund-email'
import { getMembersForEmail } from '@/app/actions/verwaltung/email/actions'
import { toast } from 'sonner'

jest.mock('@/app/actions/verwaltung/email/actions', () => ({
  getMembersForEmail: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const mockMembers = getMembersForEmail as jest.Mock
const origFetch = global.fetch

const members = [
  { ID: 1, Vorname: 'Anna', Nachname: 'A', EMail: 'anna@x.de', PassivSeit: null },
  { ID: 2, Vorname: 'Ben', Nachname: 'B', EMail: 'ben@x.de', PassivSeit: new Date('2020-01-01') },
  { ID: 3, Vorname: 'Cem', Nachname: 'C', EMail: null, PassivSeit: null },
]

async function setup() {
  render(<RundEmail />)
  await screen.findByText('Anna A')
}
const send = () => fireEvent.click(screen.getByRole('button', { name: /Versenden/ }))

describe('RundEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMembers.mockResolvedValue({ success: true, data: members })
  })
  afterEach(() => {
    global.fetch = origFetch
  })

  it('lists all members and preselects those with email', async () => {
    await setup()
    expect(screen.getByText('Ben B')).toBeInTheDocument()
    expect(screen.getByText('Cem C')).toBeInTheDocument()
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes[0]).toBeChecked()
    expect(boxes[1]).toBeChecked()
    expect(boxes[2]).not.toBeChecked()
  })

  it('filters to active members', async () => {
    await setup()
    fireEvent.click(screen.getByLabelText('Nur aktive'))
    await waitFor(() => expect(screen.queryByText('Ben B')).not.toBeInTheDocument())
    expect(screen.getByText('Anna A')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Alle Mitglieder'))
    expect(await screen.findByText('Ben B')).toBeInTheDocument()
  })

  it('shows empty message when no members are returned', async () => {
    mockMembers.mockResolvedValue({ success: true, data: [] })
    render(<RundEmail />)
    expect(await screen.findByText('Keine Mitglieder gefunden')).toBeInTheDocument()
  })

  it('toasts on load error variants', async () => {
    mockMembers.mockResolvedValueOnce({ success: false, error: 'E1' })
    const { unmount } = render(<RundEmail />)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('E1'))
    unmount()
    mockMembers.mockResolvedValueOnce({ success: false })
    const r2 = render(<RundEmail />)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Laden der Mitglieder'))
    r2.unmount()
    mockMembers.mockRejectedValueOnce(new Error('x'))
    render(<RundEmail />)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Netzwerkfehler beim Laden der Mitglieder'))
  })

  it('toggles a recipient', async () => {
    await setup()
    const first = screen.getAllByRole('checkbox')[0]
    fireEvent.click(first)
    expect(first).not.toBeChecked()
    fireEvent.click(first)
    expect(first).toBeChecked()
  })

  it('adds a valid extra recipient and rejects invalid ones', async () => {
    await setup()
    const input = screen.getByPlaceholderText('name@beispiel.de')
    fireEvent.change(input, { target: { value: 'kaputt' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Hinzufügen/ })[0])
    expect(toast.error).toHaveBeenCalledWith('Ungültige E-Mail-Adresse')

    fireEvent.change(input, { target: { value: 'neu@x.de' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Hinzufügen/ })[0])
    expect(await screen.findByText('neu@x.de')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('"Löschen" clears selection and manual recipients', async () => {
    await setup()
    const input = screen.getByPlaceholderText('name@beispiel.de')
    fireEvent.change(input, { target: { value: 'neu@x.de' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Hinzufügen/ })[0])
    await screen.findByText('neu@x.de')
    fireEvent.click(screen.getAllByRole('button', { name: /Löschen/ })[0])
    await waitFor(() => expect(screen.queryByText('neu@x.de')).not.toBeInTheDocument())
    screen.getAllByRole('checkbox').forEach(b => expect(b).not.toBeChecked())
  })

  it('validates subject and message before sending', async () => {
    global.fetch = jest.fn() as any
    await setup()
    send()
    expect(toast.error).toHaveBeenCalledWith('Bitte Betreff eingeben')
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'S' } })
    send()
    expect(toast.error).toHaveBeenCalledWith('Bitte Nachricht eingeben')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refuses to send without recipients', async () => {
    global.fetch = jest.fn() as any
    await setup()
    screen.getAllByRole('checkbox').forEach(b => { if (b.getAttribute('aria-checked') === 'true') fireEvent.click(b) })
    send()
    expect(toast.error).toHaveBeenCalledWith('Keine Empfänger ausgewählt')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('sends the mail with recipients and attachments', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any
    await setup()
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'Betr' } })
    fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'Msg' } })
    send()
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('E-Mail erfolgreich versendet'))
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/email/send')
    expect(JSON.parse(opts.body)).toEqual({
      recipients: ['anna@x.de', 'ben@x.de'],
      subject: 'Betr',
      message: 'Msg',
      attachments: [],
    })
  })

  it('shows error from server and network failures', async () => {
    await setup()
    fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'Betr' } })
    fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'Msg' } })

    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Böse' }) }) as any
    send()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Böse'))

    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as any
    send()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Versand'))

    global.fetch = jest.fn().mockRejectedValue(new Error('x')) as any
    send()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Netzwerkfehler beim E-Mail-Versand'))
  })

  describe('attachments', () => {
    const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement

    it('adds, lists, removes and clears attachments; rejects big files', async () => {
      await setup()
      expect(screen.getByText('Keine Anhänge')).toBeInTheDocument()

      const f1 = new File(['hello'], 'a.txt', { type: 'text/plain' })
      const f2 = new File(['world'], 'b.txt', { type: 'text/plain' })
      fireEvent.change(fileInput(), { target: { files: [f1, f2] } })
      expect(await screen.findByText('a.txt')).toBeInTheDocument()
      expect(await screen.findByText('b.txt')).toBeInTheDocument()

      // einzelnes entfernen (Papierkorb-Buttons ohne Text in der Liste)
      const listItem = screen.getByText('a.txt').closest('li')!
      fireEvent.click(listItem.querySelector('button')!)
      expect(screen.queryByText('a.txt')).not.toBeInTheDocument()

      // alle entfernen
      fireEvent.click(screen.getAllByRole('button', { name: /Löschen/ })[1])
      expect(screen.getByText('Keine Anhänge')).toBeInTheDocument()

      const big = new File(['x'], 'big.bin')
      Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 })
      fireEvent.change(fileInput(), { target: { files: [big] } })
      expect(toast.error).toHaveBeenCalledWith('Datei "big.bin" ist zu groß (max. 5MB)')
      expect(screen.getByText('Keine Anhänge')).toBeInTheDocument()
    })

    it('sends attachments as base64', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any
      await setup()
      fireEvent.change(fileInput(), { target: { files: [new File(['hello'], 'a.txt', { type: 'text/plain' })] } })
      await screen.findByText('a.txt')
      fireEvent.change(screen.getByLabelText('Betreff'), { target: { value: 'S' } })
      fireEvent.change(screen.getByLabelText('Nachricht'), { target: { value: 'M' } })
      send()
      await waitFor(() => expect(global.fetch).toHaveBeenCalled())
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.attachments).toEqual([{ name: 'a.txt', content: 'aGVsbG8=', contentType: 'text/plain' }])
    })

    it('ignores an empty file selection', async () => {
      await setup()
      fireEvent.change(fileInput(), { target: { files: [] } })
      expect(screen.getByText('Keine Anhänge')).toBeInTheDocument()
    })
  })
})
