import { render, screen, fireEvent } from '@testing-library/react'
import { StatistikAuswahl } from '../statistik-auswahl'

describe('StatistikAuswahl', () => {
  it('renders all options with the current one selected', () => {
    render(<StatistikAuswahl value="pokal" onValueChange={jest.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(9)
    expect(screen.getByLabelText('Pokal')).toBeChecked()
    expect(screen.getByLabelText('Neuner')).not.toBeChecked()
  })

  it.each([
    ['Neuner', 'neuner'],
    ['Ratten', 'ratten'],
    ['Sarg', 'sarg'],
    ['Ergebnisse Spieler/Spieler', 'ergebnisse-spieler'],
    ['Platzierung 6-Tage-Rennen', 'platzierung-6tage'],
    ['Beste Mannschaft 6-Tage-Rennen', 'beste-mannschaft-6tage'],
    ['Mannschaft / Mitglied 6-Tage-Rennen', 'mannschaft-mitglied-6tage'],
    ['Neunerkönig / Rattenorden', 'neunerkoenig-rattenorden'],
  ])('reports %s as %s', (label, value) => {
    const onValueChange = jest.fn()
    render(<StatistikAuswahl value="pokal" onValueChange={onValueChange} />)
    fireEvent.click(screen.getByLabelText(label))
    expect(onValueChange).toHaveBeenCalledWith(value)
  })
})
