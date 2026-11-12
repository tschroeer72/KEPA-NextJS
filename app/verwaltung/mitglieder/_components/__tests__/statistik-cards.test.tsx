import { render, screen } from '@testing-library/react'
import StatistikCards from '../statistik-cards'
import { getStatistikSpielerById } from '@/app/actions/verwaltung/statistik/actions'

jest.mock('@/app/actions/verwaltung/statistik/actions', () => ({
  getStatistikSpielerById: jest.fn(),
}))
const mockGet = getStatistikSpielerById as jest.Mock

const stat = {
  HolzMeisterMax: 90, HolzMeisterMin: 10, HolzMeisterAVG: 55.5, HolzMeisterSumme: 555,
  HolzBlitzMax: 8, HolzBlitzMin: 2, HolzBlitzAVG: 4.256, HolzBlitzSumme: 40,
  HolzMax: 91, HolzMin: 1, HolzAVG: 50, HolzSumme: 999,
  RattenMax: 3, RattenSumme: 4, NeunerMax: 5, NeunerSumme: 6, Kranz8Max: 7, Kranz8Summe: 8,
}

describe('StatistikCards', () => {
  beforeEach(() => jest.clearAllMocks())

  it('does not call action for invalid spielerId', () => {
    render(<StatistikCards spielerId={-1} />)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('renders cards with formatted values', async () => {
    mockGet.mockResolvedValue({ success: true, data: stat })
    render(<StatistikCards spielerId={5} />)
    expect(await screen.findByText('Meisterschaft')).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith(5)
    expect(screen.getByText('55.50')).toBeInTheDocument()
    expect(screen.getByText('4.26')).toBeInTheDocument()
    expect(screen.getByText('50.00')).toBeInTheDocument()
    expect(screen.getByText('Blitztunier')).toBeInTheDocument()
    expect(screen.getByText('Gesamt (Holz)')).toBeInTheDocument()
    expect(screen.getByText('Neuner, Kranz 8 & Ratten')).toBeInTheDocument()
    expect(screen.getByText('999')).toBeInTheDocument()
  })

  it('shows error message from result', async () => {
    mockGet.mockResolvedValue({ success: false, error: 'Nix da' })
    render(<StatistikCards spielerId={5} />)
    expect(await screen.findByText('Nix da')).toBeInTheDocument()
  })

  it('shows default error when result has none', async () => {
    mockGet.mockResolvedValue({ success: false })
    render(<StatistikCards spielerId={5} />)
    expect(await screen.findByText('Fehler beim Laden der Statistik')).toBeInTheDocument()
  })

  it('shows unexpected error when action throws', async () => {
    mockGet.mockRejectedValue(new Error('x'))
    render(<StatistikCards spielerId={5} />)
    expect(await screen.findByText('Ein unerwarteter Fehler ist aufgetreten')).toBeInTheDocument()
  })
})
