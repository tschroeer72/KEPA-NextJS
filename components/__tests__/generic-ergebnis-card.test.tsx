import { render, screen, fireEvent } from '@testing-library/react'
import GenericErgebnisCard from '../generic-ergebnis-card'

// Mock UI components if Radix is not playing nice in tests
jest.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, onValueChange }: any) => <div data-testid="tabs" onClick={() => onValueChange && onValueChange("pokal")}>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button role="tab">{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}))

describe('GenericErgebnisCard Component', () => {
  const onSpielChange = jest.fn()
  const mockData = {
    neunerRatten: [
      { Spieltag: 1, Spielername: 'Player 1', Neuner: 2, Ratten: 1, Kranz8: 0 }
    ],
    sechsTageRennen: [],
    pokal: [],
    meisterschaften: [],
    king: [],
    abraeumen: [],
    sauspiel: [],
    fuchs: []
  }

  it('renders the title', () => {
    render(
      <GenericErgebnisCard 
        spiel="9er-ratten-kranz8" 
        onSpielChange={onSpielChange} 
        data={mockData as any} 
        title="Test Title" 
      />
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders "Keine Daten" when data is null', () => {
    render(
      <GenericErgebnisCard 
        spiel="9er-ratten-kranz8" 
        onSpielChange={onSpielChange} 
        data={null} 
        title="Test Title" 
      />
    )
    expect(screen.getAllByText(/Keine Daten für diesen Tag gefunden/i).length).toBeGreaterThan(0)
  })

  it('renders the table when data is provided', () => {
    render(
      <GenericErgebnisCard 
        spiel="9er-ratten-kranz8" 
        onSpielChange={onSpielChange} 
        data={mockData as any} 
        title="Test Title" 
      />
    )
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Neuner')).toBeInTheDocument()
  })

  it('calls onSpielChange when a tab is clicked', async () => {
    render(
      <GenericErgebnisCard 
        spiel="9er-ratten-kranz8" 
        onSpielChange={onSpielChange} 
        data={mockData as any} 
        title="Test Title" 
      />
    )
    
    // Radix Tabs Triggers are often buttons
    const tab = screen.getByRole('tab', { name: /Pokal/i })
    fireEvent.click(tab)

    // Manchmal brauchen Radix-Komponenten in JSDOM einen Moment oder spezielle Events
    // Falls fireEvent.click nicht reicht, probieren wir es mit den Props direkt wenn nötig,
    // aber erst mal schauen wir ob getByRole hilft.
    expect(onSpielChange).toHaveBeenCalled()
  })
})
