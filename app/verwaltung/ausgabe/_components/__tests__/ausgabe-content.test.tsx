import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AusgabeContent } from '../ausgabe-content'
import { getErgebnisse } from '@/app/actions/verwaltung/ausgabe/actions'

jest.mock('@/app/actions/verwaltung/ausgabe/actions', () => ({
  getErgebnisse: jest.fn(),
}))

jest.mock('../auswahl-card', () => ({
  AuswahlCard: ({ onRefresh }: any) => (
    <button onClick={() => onRefresh([1, 2])}>Refresh Mock</button>
  )
}))

jest.mock('@/components/generic-ergebnis-card', () => {
  return function MockGenericErgebnisCard({ title, data }: any) {
    return (
      <div data-testid="generic-card">
        {title}
        {data && <div data-testid="data-present">Data Present</div>}
      </div>
    )
  }
})

describe('AusgabeContent Component', () => {
  const mockMeisterschaften = [{ id: 1, name: 'M1' }] as any

  it('renders and handles refresh', async () => {
    const mockData = { neunerRatten: [] }
    ;(getErgebnisse as jest.Mock).mockResolvedValue(mockData)

    render(<AusgabeContent meisterschaften={mockMeisterschaften} />)
    
    expect(screen.getByTestId('generic-card')).toBeInTheDocument()
    
    fireEvent.click(screen.getByText('Refresh Mock'))

    await waitFor(() => {
      expect(getErgebnisse).toHaveBeenCalledWith([1, 2])
      expect(screen.getByTestId('data-present')).toBeInTheDocument()
    })
  })
})
