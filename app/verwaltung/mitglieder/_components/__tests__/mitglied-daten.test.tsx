import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import MitgliedDaten from '../mitglied-daten'
import { getMitgliedById, updateMitglied, createMitglied } from '@/app/actions/verwaltung/mitglieder/actions'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

jest.mock('@/app/actions/verwaltung/mitglieder/actions', () => ({
  getMitgliedById: jest.fn(),
  updateMitglied: jest.fn(),
  createMitglied: jest.fn(),
}))
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() },
}))
// Kind-Komponenten vereinfachen (das Formular ist doppelt gerendert, daher nur die Daten anzeigen)
jest.mock('../form-persoenliches', () => ({
  __esModule: true,
  default: ({ formData, onFormDataChange, validationErrors, isEditable }: any) => (
    <div data-testid="persoenliches">
      <span data-testid="p-vorname">{formData.Vorname}</span>
      <span data-testid="p-editable">{String(isEditable)}</span>
      <span data-testid="p-errors">{Object.values(validationErrors).join('|')}</span>
      <button onClick={() => onFormDataChange('Vorname', 'Neu')}>set-vorname</button>
      <button onClick={() => onFormDataChange('Vorname', '')}>clear-vorname</button>
      <button onClick={() => onFormDataChange('Nachname', 'Nachn')}>set-nachname</button>
      <button onClick={() => onFormDataChange('PLZ', 'abc')}>set-bad-plz</button>
    </div>
  ),
}))
jest.mock('../form-notizen', () => ({
  __esModule: true,
  default: ({ formData, onFormDataChange }: any) => (
    <div data-testid="notizen">
      <span data-testid="n-notizen">{formData.Notizen}</span>
      <button onClick={() => onFormDataChange('Notizen', 'Notiz neu')}>set-notiz</button>
    </div>
  ),
}))
jest.mock('../mitglied-ergebnisse', () => ({
  __esModule: true,
  default: ({ spielerId }: any) => <div>Ergebnisse {spielerId}</div>,
}))
jest.mock('../statistik-cards', () => ({
  __esModule: true,
  default: ({ spielerId }: any) => <div>Statistik {spielerId}</div>,
}))

const mockGet = getMitgliedById as jest.Mock
const mockUpdate = updateMitglied as jest.Mock
const mockCreate = createMitglied as jest.Mock

const mitglied = {
  ID: 5,
  Vorname: 'Max',
  Nachname: 'Muster',
  Notizen: 'Alt-Notiz',
  Bemerkungen: null,
  MitgliedSeit: new Date(2010, 0, 1),
  Geburtsdatum: null,
  Ehemaliger: false,
}

const btn = (name: RegExp | string) => screen.getByRole('button', { name })
const getBtnAll = (name: string) => screen.getAllByRole('button', { name })

describe('MitgliedDaten', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // Standard: Laden haengt (die Komponente ruft auch fuer ID <= 0 getMitgliedById auf)
    mockGet.mockReturnValue(new Promise(() => {}))
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it('shows "Kein Mitglied ausgewählt" for ID -1 and allows only "Neues Mitglied"', () => {
    render(<MitgliedDaten MitgliedID={-1} />)
    expect(screen.getByText('Kein Mitglied ausgewählt')).toBeInTheDocument()
    expect(btn('Neues Mitglied')).toBeEnabled()
    expect(btn('Bearbeiten')).toBeDisabled()
    expect(btn('Speichern')).toBeDisabled()
    expect(screen.getAllByRole('button').find(b => /PDF|Drucken/.test(b.textContent || ''))).toBeDisabled()
  })

  it('"Neues Mitglied" from empty state opens an editable empty form', async () => {
    render(<MitgliedDaten MitgliedID={-1} />)
    fireEvent.click(btn('Neues Mitglied'))
    expect((await screen.findAllByTestId('p-editable'))[0]).toHaveTextContent('true')
    await userEvent.setup().click(screen.getByRole('tab', { name: 'Ergebnisse' }))
    expect(await screen.findByText('Ergebnisse erst nach dem Speichern verfügbar.')).toBeInTheDocument()
    expect(btn('Speichern')).toBeEnabled()
    expect(btn('Neues Mitglied')).toBeDisabled()
  })

  it('loads and displays an existing member', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    render(<MitgliedDaten MitgliedID={5} />)
    await waitFor(() => expect(screen.getAllByTestId('p-vorname')[0]).toHaveTextContent('Max'))
    expect(mockGet).toHaveBeenCalledWith(5)
    expect(screen.getAllByTestId('n-notizen')[0]).toHaveTextContent('Alt-Notiz')
    expect(btn('Bearbeiten')).toBeEnabled()
    expect(btn('Speichern')).toBeDisabled()
    expect(screen.getAllByTestId('p-editable')[0]).toHaveTextContent('false')
  })

  it('shows error text when loading fails with message', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Nicht da' })
    render(<MitgliedDaten MitgliedID={5} />)
    expect(await screen.findByText('Fehler: Nicht da')).toBeInTheDocument()
    expect(btn('Neues Mitglied')).toBeEnabled()
    expect(btn('Bearbeiten')).toBeDisabled()
  })

  it('shows default error when loading fails without message', async () => {
    mockGet.mockResolvedValue({ success: false })
    render(<MitgliedDaten MitgliedID={5} />)
    expect(await screen.findByText('Fehler: Fehler beim Laden der Mitgliederdaten')).toBeInTheDocument()
  })

  it('shows "Unbekannter Fehler" when the action throws', async () => {
    mockGet.mockRejectedValue(new Error('boom'))
    render(<MitgliedDaten MitgliedID={5} />)
    expect(await screen.findByText('Fehler: Unbekannter Fehler')).toBeInTheDocument()
  })

  it('updates an existing member: edit, save, toast and onDataChange', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    mockUpdate.mockResolvedValue({ success: true, data: { ...mitglied, Vorname: 'Neu' } })
    const onDataChange = jest.fn()
    render(<MitgliedDaten MitgliedID={5} onDataChange={onDataChange} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())

    fireEvent.click(btn('Bearbeiten'))
    expect(btn('Speichern')).toBeEnabled()
    expect(btn('Neues Mitglied')).toBeDisabled()
    expect(screen.getAllByTestId('p-editable')[0]).toHaveTextContent('true')

    fireEvent.click(screen.getAllByText('set-vorname')[0])
    fireEvent.click(screen.getAllByText('set-notiz')[0])
    fireEvent.click(btn('Speichern'))

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1))
    const [id, data] = mockUpdate.mock.calls[0]
    expect(id).toBe(5)
    expect(data).toEqual(expect.objectContaining({ Vorname: 'Neu', Nachname: 'Muster', Notizen: 'Notiz neu' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Mitgliederdaten wurden erfolgreich geändert!'))
    expect(onDataChange).toHaveBeenCalledTimes(1)
    expect(btn('Bearbeiten')).toBeEnabled()
    expect(btn('Speichern')).toBeDisabled()
  })

  it('shows toast and skips action on validation errors', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    render(<MitgliedDaten MitgliedID={5} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(screen.getAllByText('clear-vorname')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Validierungsfehler: Vorname darf nicht leer sein')
    )
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(screen.getAllByTestId('p-errors')[0]).toHaveTextContent('Vorname darf nicht leer sein')
  })

  it('validates PLZ format', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    render(<MitgliedDaten MitgliedID={5} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(screen.getAllByText('set-bad-plz')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('shows error toast when update fails', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    mockUpdate.mockResolvedValue({ success: false, error: 'DB kaputt' })
    const onDataChange = jest.fn()
    render(<MitgliedDaten MitgliedID={5} onDataChange={onDataChange} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('DB kaputt'))
    expect(onDataChange).not.toHaveBeenCalled()
    expect(await screen.findByText('Fehler: DB kaputt')).toBeInTheDocument()
  })

  it('uses default message when update fails without error text', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    mockUpdate.mockResolvedValue({ success: false })
    render(<MitgliedDaten MitgliedID={5} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Aktualisieren des Mitglieds'))
  })

  it('creates a new member', async () => {
    mockCreate.mockResolvedValue({ success: true, data: { ...mitglied, ID: 9 } })
    const onDataChange = jest.fn()
    render(<MitgliedDaten MitgliedID={0} onDataChange={onDataChange} />)
    fireEvent.click(btn('Neues Mitglied'))
    fireEvent.click(screen.getAllByText('set-vorname')[0])
    fireEvent.click(screen.getAllByText('set-nachname')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1))
    expect(mockCreate.mock.calls[0][0]).toEqual(expect.objectContaining({ Vorname: 'Neu', Nachname: 'Nachn' }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Mitglied wurde erfolgreich angelegt!'))
    expect(onDataChange).toHaveBeenCalled()
  })

  it('shows error toast when create fails (with and without message)', async () => {
    mockCreate.mockResolvedValueOnce({ success: false, error: 'Doppelt' })
    render(<MitgliedDaten MitgliedID={0} />)
    fireEvent.click(btn('Neues Mitglied'))
    fireEvent.click(screen.getAllByText('set-vorname')[0])
    fireEvent.click(screen.getAllByText('set-nachname')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Doppelt'))
  })

  it('uses default message when create fails without error text', async () => {
    mockCreate.mockResolvedValueOnce({ success: false })
    render(<MitgliedDaten MitgliedID={0} />)
    fireEvent.click(btn('Neues Mitglied'))
    fireEvent.click(screen.getAllByText('set-vorname')[0])
    fireEvent.click(screen.getAllByText('set-nachname')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Erstellen des Mitglieds'))
  })

  describe('PDF', () => {
    const origFetch = global.fetch
    beforeEach(() => {
      ;(window.URL as any).createObjectURL = jest.fn(() => 'blob:x')
      ;(window.URL as any).revokeObjectURL = jest.fn()
      jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    })
    afterEach(() => {
      global.fetch = origFetch
    })

    async function loadMember() {
      mockGet.mockResolvedValue({ success: true, data: mitglied })
      render(<MitgliedDaten MitgliedID={5} />)
      await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    }
    const pdfBtn = () => screen.getAllByRole('button').find(b => /PDF|Drucken/.test(b.textContent || ''))!

    it('requests the PDF with selected options and downloads it', async () => {
      await loadMember()
      global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) }) as any
      fireEvent.click(pdfBtn())
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('PDF erfolgreich erstellt!'))
      expect(toast.info).toHaveBeenCalledWith('PDF wird generiert...')
      const [url, opts] = (global.fetch as jest.Mock).mock.calls[0]
      expect(url).toBe('/api/mitglieder/statistik-pdf')
      expect(JSON.parse(opts.body)).toEqual({ mitgliedId: 5, showErgebnisse: true, showStatistik: true })
    })

    it('respects unchecked options and disables PDF if both are unchecked', async () => {
      await loadMember()
      global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) }) as any
      fireEvent.click(screen.getByRole('checkbox', { name: 'Ergebnisse' }))
      fireEvent.click(pdfBtn())
      await waitFor(() => expect(global.fetch).toHaveBeenCalled())
      expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
        mitgliedId: 5, showErgebnisse: false, showStatistik: true,
      })
      fireEvent.click(screen.getByRole('checkbox', { name: 'Statistik' }))
      expect(pdfBtn()).toBeDisabled()
    })

    it('shows error toast with server message', async () => {
      await loadMember()
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'PDF kaputt' }) }) as any
      fireEvent.click(pdfBtn())
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('PDF kaputt'))
    })

    it('shows fallback error toast on network failure without message', async () => {
      await loadMember()
      global.fetch = jest.fn().mockRejectedValue({}) as any
      fireEvent.click(pdfBtn())
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Drucken'))
    })

    it('shows default message when server returns no error text', async () => {
      await loadMember()
      global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as any
      fireEvent.click(pdfBtn())
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Generieren des PDFs'))
    })
  })

  it('shows results and statistics for existing members', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    render(<MitgliedDaten MitgliedID={5} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    const u = userEvent.setup()
    await u.click(screen.getByRole('tab', { name: 'Ergebnisse' }))
    expect(await screen.findByText('Ergebnisse 5')).toBeInTheDocument()
    await u.click(screen.getByRole('tab', { name: 'Statistik' }))
    expect(await screen.findByText('Statistik 5')).toBeInTheDocument()
    await u.click(screen.getByRole('tab', { name: 'Notizen' }))
    expect(screen.getAllByTestId('notizen').length).toBeGreaterThan(0)
  })

  it('resets to empty state when MitgliedID prop changes to -1', async () => {
    mockGet.mockResolvedValue({ success: true, data: mitglied })
    const { rerender } = render(<MitgliedDaten MitgliedID={5} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    await act(async () => {
      rerender(<MitgliedDaten MitgliedID={-1} />)
    })
    expect(screen.getByText('Kein Mitglied ausgewählt')).toBeInTheDocument()
  })
})
