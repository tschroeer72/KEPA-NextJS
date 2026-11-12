import { render, screen } from '@testing-library/react'
import MitgliedErgebnisse from '../mitglied-ergebnisse'
import { getStatistikSpielerErgebnisse } from '@/app/actions/verwaltung/statistik/actions'

jest.mock('@/app/actions/verwaltung/statistik/actions', () => ({
  getStatistikSpielerErgebnisse: jest.fn(),
}))
const mockGet = getStatistikSpielerErgebnisse as jest.Mock

describe('MitgliedErgebnisse', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    render(<MitgliedErgebnisse spielerId={1} />)
    expect(screen.getByText('Lade Ergebnisse...')).toBeInTheDocument()
  })

  it('shows empty message', async () => {
    mockGet.mockResolvedValue([])
    render(<MitgliedErgebnisse spielerId={1} />)
    expect(await screen.findByText('Keine Ergebnisse für dieses Mitglied gefunden.')).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith(1)
  })

  it('renders rows with formatted date and dashes for missing values', async () => {
    mockGet.mockResolvedValue([
      { Spieltag: new Date(2024, 2, 5), Meisterschaft: 'Meister 24', Gegenspieler: 'Otto', Ergebnis: 3, Holz: 40 },
    ])
    render(<MitgliedErgebnisse spielerId={1} />)
    expect(await screen.findByText('05.03.2024')).toBeInTheDocument()
    expect(screen.getByText('Meister 24')).toBeInTheDocument()
    expect(screen.getByText('Otto')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThan(3)
  })

  it('handles action error by showing empty message', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockGet.mockRejectedValue(new Error('x'))
    render(<MitgliedErgebnisse spielerId={1} />)
    expect(await screen.findByText('Keine Ergebnisse für dieses Mitglied gefunden.')).toBeInTheDocument()
    spy.mockRestore()
  })

  it('does not fetch for spielerId <= 0 (stays in loading)', () => {
    render(<MitgliedErgebnisse spielerId={-1} />)
    expect(mockGet).not.toHaveBeenCalled()
    expect(screen.getByText('Lade Ergebnisse...')).toBeInTheDocument()
  })
})
