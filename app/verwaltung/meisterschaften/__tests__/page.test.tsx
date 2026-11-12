import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MeisterschaftenPage from '../page'
import { getMeisterschaften } from '@/app/actions/verwaltung/meisterschaften/actions'

jest.mock('@/app/actions/verwaltung/meisterschaften/actions', () => ({ getMeisterschaften: jest.fn() }))

jest.mock('../_components/meisterschaftliste', () => ({
  __esModule: true,
  default: ({ lstMeisterschaften, onMeisterschaftSelect }: any) => (
    <div data-testid="liste">
      {lstMeisterschaften.map((m: any) => (
        <button key={m.ID} onClick={() => onMeisterschaftSelect(m.ID)}>{m.Bezeichnung}</button>
      ))}
    </div>
  ),
}))
jest.mock('../_components/meisterschaft-daten', () => ({
  __esModule: true,
  default: ({ MeisterschaftID, onDataChange }: any) => (
    <div data-testid="daten" data-id={MeisterschaftID}>
      <button onClick={onDataChange}>changed</button>
    </div>
  ),
}))

describe('MeisterschaftenPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => (console.error as jest.Mock).mockRestore())

  it('shows loading state first', async () => {
    ;(getMeisterschaften as jest.Mock).mockResolvedValue({ success: true, data: [] })
    render(<MeisterschaftenPage />)
    expect(screen.getByText('Lade Meisterschaftsverwaltung...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('liste')).toBeInTheDocument())
  })

  it('renders list + details and passes selected id', async () => {
    ;(getMeisterschaften as jest.Mock).mockResolvedValue({ success: true, data: [{ ID: 4, Bezeichnung: 'Liga 4' }] })
    render(<MeisterschaftenPage />)
    await screen.findByText('Liga 4')
    expect(screen.getByRole('heading', { name: 'Meisterschaftsverwaltung' })).toBeInTheDocument()
    expect(screen.getByTestId('daten')).toHaveAttribute('data-id', '-1')
    fireEvent.click(screen.getByText('Liga 4'))
    expect(screen.getByTestId('daten')).toHaveAttribute('data-id', '4')
  })

  it('reloads list when data changed', async () => {
    ;(getMeisterschaften as jest.Mock).mockResolvedValue({ success: true, data: [{ ID: 4, Bezeichnung: 'Liga 4' }] })
    render(<MeisterschaftenPage />)
    await screen.findByText('Liga 4')
    expect(getMeisterschaften).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('changed'))
    await waitFor(() => expect(getMeisterschaften).toHaveBeenCalledTimes(2))
    await screen.findByText('Liga 4')
  })

  it('shows error from action result', async () => {
    ;(getMeisterschaften as jest.Mock).mockResolvedValue({ success: false, error: 'DB kaputt' })
    render(<MeisterschaftenPage />)
    expect(await screen.findByText('DB kaputt')).toBeInTheDocument()
  })

  it('shows default error when action has no message', async () => {
    ;(getMeisterschaften as jest.Mock).mockResolvedValue({ success: false })
    render(<MeisterschaftenPage />)
    expect(await screen.findByText('Fehler beim Laden der Meisterschaftenliste')).toBeInTheDocument()
  })

  it('shows error when action throws', async () => {
    ;(getMeisterschaften as jest.Mock).mockRejectedValue(new Error('x'))
    render(<MeisterschaftenPage />)
    expect(await screen.findByText('Fehler beim Laden der Meisterschaftenliste')).toBeInTheDocument()
  })
})
