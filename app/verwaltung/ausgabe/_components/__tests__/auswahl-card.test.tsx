import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuswahlCard } from '../auswahl-card'
import { getSpieltageByMeisterschaft } from '@/app/actions/verwaltung/common/actions'

jest.mock('@/app/actions/verwaltung/common/actions', () => ({
  getSpieltageByMeisterschaft: jest.fn(),
}))

describe('AuswahlCard Component', () => {
  const onRefresh = jest.fn()
  const mockMeisterschaften = [
    { ID: 1, Bezeichnung: 'Meisterschaft 2024', Meisterschaftstyp: 'Liga' },
    { ID: 2, Bezeichnung: 'Meisterschaft 2025', Meisterschaftstyp: 'Pokal' },
  ] as any

  it('renders correctly', () => {
    render(<AuswahlCard meisterschaften={mockMeisterschaften} onRefresh={onRefresh} />)
    expect(screen.getByText('Meisterschaft wählen...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Aktualisieren/i })).toBeDisabled()
  })

  it('handles meisterschaft selection', async () => {
    const mockSpieltage = [
      { ID: 10, Spieltag: new Date('2024-01-01') },
      { ID: 11, Spieltag: new Date('2024-01-15') },
    ]
    ;(getSpieltageByMeisterschaft as jest.Mock).mockResolvedValue(mockSpieltage)

    render(<AuswahlCard meisterschaften={mockMeisterschaften} onRefresh={onRefresh} />)
    
    // Open popover
    fireEvent.click(screen.getByRole('combobox'))
    
    // Select item
    fireEvent.click(screen.getByText('Meisterschaft 2024'))

    await waitFor(() => {
      expect(getSpieltageByMeisterschaft).toHaveBeenCalledWith(1)
      expect(screen.getByText('01.01.2024')).toBeInTheDocument()
      expect(screen.getByText('15.01.2024')).toBeInTheDocument()
    })
  })

  it('calls onRefresh with selected IDs', async () => {
    const mockSpieltage = [{ ID: 10, Spieltag: new Date('2024-01-01') }]
    ;(getSpieltageByMeisterschaft as jest.Mock).mockResolvedValue(mockSpieltage)

    render(<AuswahlCard meisterschaften={mockMeisterschaften} onRefresh={onRefresh} />)
    
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByText('Meisterschaft 2024'))

    await waitFor(() => {
      expect(screen.getByText('01.01.2024')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Aktualisieren/i }))
    expect(onRefresh).toHaveBeenCalledWith([10])
  })
})
