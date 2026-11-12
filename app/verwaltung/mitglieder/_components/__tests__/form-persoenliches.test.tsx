import { render, screen, fireEvent } from '@testing-library/react'
import FormPersoenliches from '../form-persoenliches'

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: any) => (
    <div>
      <button onClick={() => onSelect(new Date(2000, 0, 15))}>pick-date</button>
      <button onClick={() => onSelect(undefined)}>pick-none</button>
    </div>
  ),
}))

const baseData = {
  Vorname: 'Max',
  Nachname: 'Muster',
  MitgliedSeit: new Date(2010, 4, 1),
  Ehemaliger: false,
}

function setup(props: Partial<React.ComponentProps<typeof FormPersoenliches>> = {}) {
  const onChange = jest.fn()
  render(
    <FormPersoenliches
      formData={baseData}
      onFormDataChange={onChange}
      validationErrors={{}}
      isEditable
      {...props}
    />
  )
  return onChange
}

describe('FormPersoenliches', () => {
  it('renders values from formData', () => {
    setup({ formData: { ...baseData, Strasse: 'Weg 1', PLZ: '12345', Ort: 'Stadt', EMail: 'a@b.de', Geburtsdatum: new Date(1980, 0, 2) } })
    expect(screen.getByPlaceholderText('Vorname')).toHaveValue('Max')
    expect(screen.getByPlaceholderText('Nachname')).toHaveValue('Muster')
    expect(screen.getByPlaceholderText('Straße und Hausnummer')).toHaveValue('Weg 1')
    expect(screen.getByPlaceholderText('PLZ')).toHaveValue('12345')
    expect(screen.getByPlaceholderText('E-Mail-Adresse')).toHaveValue('a@b.de')
    expect(screen.getByText(/2\. Januar 1980/)).toBeInTheDocument()
    expect(screen.getByText(/1\. Mai 2010/)).toBeInTheDocument()
    expect(screen.getAllByText('Datum wählen')).toHaveLength(2)
  })

  it('reports text field changes with the right field names', () => {
    const onChange = setup()
    const cases: [string, string, string][] = [
      ['Anrede', 'Anrede', 'Herr'],
      ['Vorname', 'Vorname', 'Moritz'],
      ['Nachname', 'Nachname', 'Meier'],
      ['Spitzname', 'Spitzname', 'Mo'],
      ['Straße und Hausnummer', 'Strasse', 'Weg 2'],
      ['PLZ', 'PLZ', '54321'],
      ['Ort', 'Ort', 'Dorf'],
      ['Festnetznummer', 'TelefonPrivat', '123'],
      ['Mobilnummer', 'TelefonMobil', '456'],
      ['E-Mail-Adresse', 'EMail', 'x@y.de'],
    ]
    cases.forEach(([placeholder, field, value]) => {
      fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } })
      expect(onChange).toHaveBeenLastCalledWith(field, value)
    })
  })

  it('toggles Ehemaliger checkbox', () => {
    const onChange = setup()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith('Ehemaliger', true)
  })

  it('shows validation errors', () => {
    setup({
      validationErrors: {
        Vorname: 'Vorname darf nicht leer sein',
        Nachname: 'NN-Fehler',
        PLZ: 'PLZ-Fehler',
        EMail: 'Mail-Fehler',
        Geburtsdatum: 'GD-Fehler',
        MitgliedSeit: 'MS-Fehler',
        PassivSeit: 'PS-Fehler',
        AusgeschiedenAm: 'AA-Fehler',
        Anrede: 'AN-Fehler',
        Spitzname: 'SP-Fehler',
        Strasse: 'ST-Fehler',
        Ort: 'OR-Fehler',
        TelefonPrivat: 'TP-Fehler',
        TelefonMobil: 'TM-Fehler',
      },
    })
    ;['Vorname darf nicht leer sein', 'NN-Fehler', 'PLZ-Fehler', 'Mail-Fehler', 'GD-Fehler', 'MS-Fehler',
      'PS-Fehler', 'AA-Fehler', 'AN-Fehler', 'SP-Fehler', 'ST-Fehler', 'OR-Fehler', 'TP-Fehler', 'TM-Fehler',
    ].forEach(t => expect(screen.getByText(t)).toBeInTheDocument())
  })

  it('disables everything when not editable and does not open calendars', () => {
    setup({ isEditable: false })
    expect(screen.getByPlaceholderText('Vorname')).toBeDisabled()
    expect(screen.getByRole('checkbox')).toBeDisabled()
    const dateButtons = screen.getAllByRole('button').filter(b => b.textContent?.match(/Datum wählen|2010/))
    dateButtons.forEach(b => expect(b).toBeDisabled())
    expect(screen.queryByText('pick-date')).not.toBeInTheDocument()
  })

  it('selects dates for all four date fields and closes the calendar', () => {
    const onChange = setup()
    const open = (i: number) => {
      const buttons = screen.getAllByRole('button').filter(b => b.textContent?.match(/Datum wählen|Mai 2010/))
      fireEvent.click(buttons[i])
    }
    // Reihenfolge: Geburtsdatum, Mitglied seit, Passiv seit, Ausgeschieden am
    const fields = ['Geburtsdatum', 'MitgliedSeit', 'PassivSeit', 'AusgeschiedenAm']
    fields.forEach((field, i) => {
      open(i)
      fireEvent.click(screen.getByText('pick-date'))
      expect(onChange).toHaveBeenLastCalledWith(field, new Date(2000, 0, 15))
      expect(screen.queryByText('pick-date')).not.toBeInTheDocument()
    })
  })

  it('does not report a change when no date was picked but closes calendar', () => {
    const onChange = setup()
    fireEvent.click(screen.getAllByText('Datum wählen')[0])
    fireEvent.click(screen.getByText('pick-none'))
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByText('pick-none')).not.toBeInTheDocument()
  })
})
