import { render, screen, fireEvent } from '@testing-library/react'
import AuswahlCard from '../auswahl-card'

jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Ctx = React.createContext({})
  return {
    Select: ({ value, onValueChange, disabled, children }: any) => (
      <Ctx.Provider value={{ value, onValueChange }}>
        <div data-testid="select" data-value={value} data-disabled={String(!!disabled)}>{children}</div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const c: any = React.useContext(Ctx)
      return <button onClick={() => c.onValueChange(value)}>{children}</button>
    },
  }
})
jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, disabled }: any) => (
    <button data-testid="calendar" disabled={disabled} onClick={() => onSelect(new Date(2024, 4, 3))}>cal</button>
  ),
}))

const base = {
  date: new Date(2024, 0, 1),
  onDateChange: jest.fn(),
  spiel: 'pokal',
  onSpielChange: jest.fn(),
  spielNr: '1',
  onSpielNrChange: jest.fn(),
}

describe('AuswahlCard (Eingabe)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders title, game options and no Spielnr for normal games', () => {
    render(<AuswahlCard {...base} />)
    expect(screen.getByText('Auswahl')).toBeInTheDocument()
    expect(screen.getByText('Sargkegeln')).toBeInTheDocument()
    expect(screen.queryByText('Spielnr.')).not.toBeInTheDocument()
  })

  it('calls onSpielChange when a game is chosen', () => {
    render(<AuswahlCard {...base} />)
    fireEvent.click(screen.getByText('Blitztunier'))
    expect(base.onSpielChange).toHaveBeenCalledWith('blitztunier')
  })

  it('shows Spielnr select for 6-tage-rennen and reports change', () => {
    render(<AuswahlCard {...base} spiel="6-tage-rennen" />)
    expect(screen.getByText('Spielnr.')).toBeInTheDocument()
    fireEvent.click(screen.getByText('3'))
    expect(base.onSpielNrChange).toHaveBeenCalledWith('3')
  })

  it('forwards date selection and disabled state', () => {
    const { rerender } = render(<AuswahlCard {...base} />)
    fireEvent.click(screen.getByTestId('calendar'))
    expect(base.onDateChange).toHaveBeenCalledWith(new Date(2024, 4, 3))
    rerender(<AuswahlCard {...base} disabled />)
    expect(screen.getByTestId('calendar')).toBeDisabled()
    expect(screen.getByTestId('select')).toHaveAttribute('data-disabled', 'true')
  })
})
