import { render, screen, fireEvent } from '@testing-library/react'
import { ZeitbereichAuswahl } from '../zeitbereich-auswahl'

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected }: any) => (
    <button onClick={() => onSelect(new Date(2024, 4, 17))}>
      cal {selected ? 'selected' : 'none'}
    </button>
  ),
}))

const meisterschaften = [
  { ID: 1, Bezeichnung: 'Meisterschaft 2023' },
  { ID: 2, Bezeichnung: 'Meisterschaft 2024' },
]

function setup(props: Partial<React.ComponentProps<typeof ZeitbereichAuswahl>> = {}) {
  const p = {
    zeit: 'laufende',
    setZeit: jest.fn(),
    dateVon: undefined,
    setDateVon: jest.fn(),
    dateBis: undefined,
    setDateBis: jest.fn(),
    meisterschaften,
    selectedMeisterschaftId: '2',
    setSelectedMeisterschaftId: jest.fn(),
    ...props,
  }
  render(<ZeitbereichAuswahl {...p} />)
  return p
}

describe('ZeitbereichAuswahl', () => {
  it('renders radio options and the selected championship', () => {
    setup()
    expect(screen.getByLabelText('Meisterschaft')).toBeChecked()
    expect(screen.getByLabelText('Individueller Zeitbereich')).not.toBeChecked()
    expect(screen.getByLabelText('Gesamt')).not.toBeChecked()
    expect(screen.getByRole('combobox')).toHaveTextContent('Meisterschaft 2024')
    expect(screen.getByRole('combobox')).toBeEnabled()
  })

  it('disables date buttons unless "individuell" and select unless "laufende"', () => {
    setup({ zeit: 'gesamt' })
    expect(screen.getByRole('combobox')).toBeDisabled()
    screen.getAllByRole('button', { name: /Datum/ }).forEach(b => expect(b).toBeDisabled())
  })

  it('changes the time range option', () => {
    const p = setup()
    fireEvent.click(screen.getByLabelText('Gesamt'))
    expect(p.setZeit).toHaveBeenCalledWith('gesamt')
    fireEvent.click(screen.getByLabelText('Individueller Zeitbereich'))
    expect(p.setZeit).toHaveBeenCalledWith('individuell')
  })

  it('lets the user pick a championship', () => {
    const p = setup()
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getByRole('option', { name: 'Meisterschaft 2023' }))
    expect(p.setSelectedMeisterschaftId).toHaveBeenCalledWith('1')
  })

  it('shows formatted dates and picks von/bis dates via the calendar', () => {
    const p = setup({ zeit: 'individuell', dateVon: new Date(2024, 0, 5), dateBis: new Date(2024, 1, 6) })
    expect(screen.getByText('05.01.2024')).toBeInTheDocument()
    expect(screen.getByText('06.02.2024')).toBeInTheDocument()

    fireEvent.click(screen.getByText('05.01.2024'))
    fireEvent.click(screen.getByText('cal selected'))
    expect(p.setDateVon).toHaveBeenCalledWith(new Date(2024, 4, 17))
  })

  it('picks the "bis" date', () => {
    const p = setup({ zeit: 'individuell' })
    const [, bis] = screen.getAllByRole('button', { name: /Datum/ })
    fireEvent.click(bis)
    fireEvent.click(screen.getByText('cal none'))
    expect(p.setDateBis).toHaveBeenCalledWith(new Date(2024, 4, 17))
  })

  it('renders without championships (default props)', () => {
    setup({ meisterschaften: undefined, selectedMeisterschaftId: undefined, setSelectedMeisterschaftId: undefined })
    expect(screen.getByText('Meisterschaft auswählen')).toBeInTheDocument()
  })
})
