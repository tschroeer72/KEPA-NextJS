import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Meisterschaftsdaten from '../meisterschaft-daten'
import { getMeisterschaftById, updateMeisterschaft, createMeisterschaft } from '@/app/actions/verwaltung/meisterschaften/actions'
import { toast } from 'sonner'

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('@/app/actions/verwaltung/meisterschaften/actions', () => ({
  getMeisterschaftById: jest.fn(),
  updateMeisterschaft: jest.fn(),
  createMeisterschaft: jest.fn(),
}))
jest.mock('../mitspieler', () => ({
  __esModule: true,
  default: ({ meisterschaftID }: any) => <div data-testid="mitspieler">MS {meisterschaftID}</div>,
}))
jest.mock('../form-meisterschaft-daten', () => ({
  __esModule: true,
  default: ({ formData, onFormDataChange, validationErrors, isEditable }: any) => (
    <div data-testid="form" data-editable={String(isEditable)}>
      <span data-testid="bez">{formData.Bezeichnung}</span>
      <span data-testid="typ">{formData.MeisterschaftstypID}</span>
      <span data-testid="err">{JSON.stringify(validationErrors)}</span>
      <button onClick={() => onFormDataChange('Bezeichnung', 'Geändert')}>set-bez</button>
      <button onClick={() => onFormDataChange('Bezeichnung', '')}>clear-bez</button>
      <button onClick={() => onFormDataChange('Beginn', new Date(2025, 5, 1))}>set-beginn</button>
      <button onClick={() => onFormDataChange('Ende', new Date(2025, 0, 1))}>set-ende-early</button>
    </div>
  ),
}))

const btn = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement
const dbRow = {
  ID: 3, Bezeichnung: 'Liga 24', Beginn: new Date(Date.UTC(2024, 0, 15)), Ende: new Date(Date.UTC(2024, 11, 1)),
  MeisterschaftstypID: 2, Aktiv: 1, Bemerkungen: 'b',
}

describe('Meisterschaftsdaten', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows placeholder for ID < 0 with only "Neu" enabled', () => {
    const onSelect = jest.fn()
    render(<Meisterschaftsdaten MeisterschaftID={-1} onMeisterschaftSelect={onSelect} />)
    expect(screen.getByText('Keine Meisterschaft ausgewählt')).toBeInTheDocument()
    expect(btn('Neue Meisterschaft')).toBeEnabled()
    expect(btn('Bearbeiten')).toBeDisabled()
    expect(btn('Speichern')).toBeDisabled()
    fireEvent.click(btn('Neue Meisterschaft'))
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('loads an existing Meisterschaft and shows read-only form', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    render(<Meisterschaftsdaten MeisterschaftID={3} />)
    expect(screen.getByText('Lade Meisterschaftsdaten...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByTestId('bez')[0]).toHaveTextContent('Liga 24'))
    expect(getMeisterschaftById).toHaveBeenCalledWith(3)
    expect(screen.getAllByTestId('typ')[0]).toHaveTextContent('2')
    expect(screen.getAllByTestId('form')[0]).toHaveAttribute('data-editable', 'false')
    expect(btn('Bearbeiten')).toBeEnabled()
    expect(btn('Speichern')).toBeDisabled()
  })

  it('shows the Mitspieler tab', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    render(<Meisterschaftsdaten MeisterschaftID={3} />)
    await screen.findByRole('tab', { name: 'Mitspieler' })
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Mitspieler' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Mitspieler' }))
    expect(await screen.findByTestId('mitspieler')).toHaveTextContent('MS 3')
  })

  it('shows error when loading fails (result) and when it throws', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: false, error: 'Nicht da' })
    const { unmount } = render(<Meisterschaftsdaten MeisterschaftID={3} />)
    expect(await screen.findByText('Fehler: Nicht da')).toBeInTheDocument()
    expect(btn('Bearbeiten')).toBeDisabled()
    unmount()
    ;(getMeisterschaftById as jest.Mock).mockRejectedValue(new Error('Crash'))
    render(<Meisterschaftsdaten MeisterschaftID={4} />)
    expect(await screen.findByText('Fehler: Crash')).toBeInTheDocument()
  })

  it('enters edit mode and updates existing Meisterschaft', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    ;(updateMeisterschaft as jest.Mock).mockResolvedValue({ success: true, data: { ...dbRow, Bezeichnung: 'Geändert' } })
    const onDataChange = jest.fn()
    render(<Meisterschaftsdaten MeisterschaftID={3} onDataChange={onDataChange} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    expect(btn('Speichern')).toBeEnabled()
    expect(btn('Neue Meisterschaft')).toBeDisabled()
    expect(screen.getAllByTestId('form')[0]).toHaveAttribute('data-editable', 'true')

    fireEvent.click(screen.getAllByText('set-bez')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(updateMeisterschaft).toHaveBeenCalledTimes(1))
    const [id, data] = (updateMeisterschaft as jest.Mock).mock.calls[0]
    expect(id).toBe(3)
    expect(data).toMatchObject({ Bezeichnung: 'Geändert', MeisterschaftstypID: 2, Aktiv: 1 })
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Meisterschaftsdaten wurden erfolgreich geändert!'))
    expect(onDataChange).toHaveBeenCalled()
    expect(btn('Bearbeiten')).toBeEnabled()
    expect(btn('Speichern')).toBeDisabled()
  })

  it('shows toast error when update fails', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    ;(updateMeisterschaft as jest.Mock).mockResolvedValue({ success: false, error: 'DB Fehler' })
    const onDataChange = jest.fn()
    render(<Meisterschaftsdaten MeisterschaftID={3} onDataChange={onDataChange} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('DB Fehler'))
    expect(onDataChange).not.toHaveBeenCalled()
  })

  it('validates: empty Bezeichnung blocks save', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    render(<Meisterschaftsdaten MeisterschaftID={3} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(screen.getAllByText('clear-bez')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Validierungsfehler: Bezeichnung darf nicht leer sein'))
    expect(updateMeisterschaft).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getAllByTestId('err')[0]).toHaveTextContent('Bezeichnung darf nicht leer sein'))
  })

  it('validates: Beginn after Ende is rejected', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    render(<Meisterschaftsdaten MeisterschaftID={3} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    fireEvent.click(btn('Bearbeiten'))
    fireEvent.click(screen.getAllByText('set-beginn')[0]) // 2025-06 > Ende 2024-12
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Validierungsfehler: Beginn darf nicht nach dem Ende liegen'))
    expect(updateMeisterschaft).not.toHaveBeenCalled()
  })

  it('creates a new Meisterschaft for ID 0 and selects the new ID', async () => {
    ;(createMeisterschaft as jest.Mock).mockResolvedValue({ success: true, data: { ID: 77 } })
    const onSelect = jest.fn()
    const onDataChange = jest.fn()
    render(<Meisterschaftsdaten MeisterschaftID={0} onMeisterschaftSelect={onSelect} onDataChange={onDataChange} />)
    await waitFor(() => expect(btn('Speichern')).toBeEnabled())
    expect(btn('Neue Meisterschaft')).toBeDisabled()
    fireEvent.click(screen.getAllByText('set-bez')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(createMeisterschaft).toHaveBeenCalledTimes(1))
    expect((createMeisterschaft as jest.Mock).mock.calls[0][0]).toMatchObject({ Bezeichnung: 'Geändert', MeisterschaftstypID: 1, Aktiv: 1 })
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Meisterschaft wurde erfolgreich angelegt!'))
    expect(onSelect).toHaveBeenCalledWith(77)
    expect(onDataChange).toHaveBeenCalled()
  })

  it('shows error when create fails', async () => {
    ;(createMeisterschaft as jest.Mock).mockResolvedValue({ success: false })
    render(<Meisterschaftsdaten MeisterschaftID={0} />)
    await waitFor(() => expect(btn('Speichern')).toBeEnabled())
    fireEvent.click(screen.getAllByText('set-bez')[0])
    fireEvent.click(btn('Speichern'))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Erstellen der Meisterschaft'))
  })

  it('resets when ID switches back to -1', async () => {
    ;(getMeisterschaftById as jest.Mock).mockResolvedValue({ success: true, data: dbRow })
    const { rerender } = render(<Meisterschaftsdaten MeisterschaftID={3} />)
    await waitFor(() => expect(btn('Bearbeiten')).toBeEnabled())
    rerender(<Meisterschaftsdaten MeisterschaftID={-1} />)
    expect(await screen.findByText('Keine Meisterschaft ausgewählt')).toBeInTheDocument()
    expect(btn('Bearbeiten')).toBeDisabled()
  })
})
