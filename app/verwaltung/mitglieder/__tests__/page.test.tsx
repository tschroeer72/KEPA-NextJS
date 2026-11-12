import { render, screen, waitFor, act } from '@testing-library/react'
import MitgliederPage from '../page'
import { getMitglieder } from '@/app/actions/verwaltung/mitglieder/actions'

jest.mock('@/app/actions/verwaltung/mitglieder/actions', () => ({
  getMitglieder: jest.fn(),
}))
let capturedProps: any
jest.mock('../_components/mitglieder-client', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps = props
    return <div data-testid="client">{props.lstMitglieder.length} Mitglieder</div>
  },
}))

const mockGet = getMitglieder as jest.Mock

describe('MitgliederPage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading and then the client with data', async () => {
    mockGet.mockResolvedValue({ success: true, data: [{ ID: 1 }, { ID: 2 }] })
    render(<MitgliederPage />)
    expect(screen.getByText('Lade Mitgliederliste...')).toBeInTheDocument()
    expect(await screen.findByTestId('client')).toHaveTextContent('2 Mitglieder')
    expect(screen.getByRole('heading', { name: 'Mitgliederverwaltung' })).toBeInTheDocument()
  })

  it('shows error from action result', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Kaputt' })
    render(<MitgliederPage />)
    expect(await screen.findByText('Kaputt')).toBeInTheDocument()
  })

  it('shows default error when result has none', async () => {
    mockGet.mockResolvedValue({ success: false })
    render(<MitgliederPage />)
    expect(await screen.findByText('Fehler beim Laden der Mitgliederliste')).toBeInTheDocument()
  })

  it('shows error when action throws', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGet.mockRejectedValue(new Error('x'))
    render(<MitgliederPage />)
    expect(await screen.findByText('Fehler beim Laden der Mitgliederliste')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('reloads list when onDataChange is called', async () => {
    mockGet.mockResolvedValue({ success: true, data: [] })
    render(<MitgliederPage />)
    await screen.findByTestId('client')
    await act(async () => { capturedProps.onDataChange() })
    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2))
  })
})
