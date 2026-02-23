import { render, screen, waitFor } from '@testing-library/react'
import EingabeContent from '../eingabe-content'
import { getKontrollausgabeAction } from '@/app/actions/verwaltung/eingabe'

jest.mock('@/app/actions/verwaltung/eingabe', () => ({
  getKontrollausgabeAction: jest.fn(),
}))

jest.mock('../auswahl-card', () => {
  return function MockAuswahlCard() {
    return <div data-testid="auswahl-card">AuswahlCard</div>
  }
})

jest.mock('../ergebniseingabe-card', () => {
  return function MockErgebniseingabeCard() {
    return <div data-testid="ergebniseingabe-card">ErgebniseingabeCard</div>
  }
})

jest.mock('../meisterschafts-status-card', () => {
  return function MockMeisterschaftsStatusCard() {
    return <div data-testid="status-card">StatusCard</div>
  }
})

jest.mock('@/components/generic-ergebnis-card', () => {
  return function MockGenericErgebnisCard() {
    return <div data-testid="generic-card">GenericCard</div>
  }
})

describe('EingabeContent Component', () => {
  const mockMitglieder = [] as any
  const mockAktiveMeisterschaft = { ID: 1, Bezeichnung: 'Test M', Aktiv: 1 } as any
  const mockAllMeisterschaften = [mockAktiveMeisterschaft]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getKontrollausgabeAction as jest.Mock).mockResolvedValue({ success: true, data: {} })
  })

  it('renders all sub-components', async () => {
    render(
      <EingabeContent 
        mitglieder={mockMitglieder} 
        aktiveMeisterschaft={mockAktiveMeisterschaft} 
        allMeisterschaften={mockAllMeisterschaften} 
      />
    )
    
    expect(screen.getByTestId('status-card')).toBeInTheDocument()
    expect(screen.getByTestId('auswahl-card')).toBeInTheDocument()
    expect(screen.getByTestId('ergebniseingabe-card')).toBeInTheDocument()
    expect(screen.getByTestId('generic-card')).toBeInTheDocument()

    await waitFor(() => {
      expect(getKontrollausgabeAction).toHaveBeenCalled()
    })
  })
})
