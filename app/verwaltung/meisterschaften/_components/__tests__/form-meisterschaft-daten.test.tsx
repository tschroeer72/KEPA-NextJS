import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FormMeisterschaftDaten from '../form-meisterschaft-daten'
import { getMeisterschaftstypen } from '@/app/actions/verwaltung/meisterschaften/actions'

jest.mock('@/app/actions/verwaltung/meisterschaften/actions', () => ({ getMeisterschaftstypen: jest.fn() }))
jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }: any) => (
    <div>
      <button onClick={() => onSelect(new Date(2025, 2, 10))}>pick</button>
      <button onClick={() => onSelect(undefined)}>pick-none</button>
    </div>
  ),
}))
jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Ctx = React.createContext({})
  return {
    Select: ({ onValueChange, disabled, value, children }: any) => (
      <Ctx.Provider value={{ onValueChange }}><div data-testid="typ-select" data-value={value} data-disabled={String(!!disabled)}>{children}</div></Ctx.Provider>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const c: any = React.useContext(Ctx)
      return <button onClick={() => c.onValueChange(value)}>{children}</button>
    },
  }
})

const formData: any = {
  Bezeichnung: 'Liga 24',
  Beginn: new Date(2024, 0, 15),
  Ende: undefined,
  MeisterschaftstypID: 2,
  Aktiv: 1,
  Bemerkungen: 'bem',
}

function setup(over: any = {}) {
  const props = { formData, onFormDataChange: jest.fn(), validationErrors: {}, isEditable: true, ...over }
  render(<FormMeisterschaftDaten {...props} />)
  return props
}

describe('FormMeisterschaftDaten', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getMeisterschaftstypen as jest.Mock).mockResolvedValue({
      success: true,
      data: [{ ID: 1, Meisterschaftstyp: 'Liga' }, { ID: 2, Meisterschaftstyp: 'Pokal' }],
    })
  })

  it('renders values and loads Meisterschaftstypen', async () => {
    setup()
    expect(screen.getByDisplayValue('Liga 24')).toBeInTheDocument()
    expect(screen.getByDisplayValue('bem')).toBeInTheDocument()
    expect(screen.getByText('Lade Meisterschaftstypen...')).toBeInTheDocument()
    expect(await screen.findByText('Pokal')).toBeInTheDocument()
    expect(screen.getByText('Liga')).toBeInTheDocument()
    expect(screen.getByText(/2024/)).toBeInTheDocument()
    expect(screen.getByText('Datum wählen')).toBeInTheDocument() // Ende empty
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('reports text input changes', async () => {
    const p = setup()
    await screen.findByText('Pokal')
    fireEvent.change(screen.getByPlaceholderText('Bezeichnung'), { target: { value: 'Neu' } })
    expect(p.onFormDataChange).toHaveBeenCalledWith('Bezeichnung', 'Neu')
    fireEvent.change(screen.getByPlaceholderText('Bemerkungen'), { target: { value: 'x' } })
    expect(p.onFormDataChange).toHaveBeenCalledWith('Bemerkungen', 'x')
  })

  it('selects type as number and toggles Aktiv', async () => {
    const p = setup()
    fireEvent.click(await screen.findByText('Liga'))
    expect(p.onFormDataChange).toHaveBeenCalledWith('MeisterschaftstypID', 1)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(p.onFormDataChange).toHaveBeenCalledWith('Aktiv', 0)
  })

  it('opens calendars, selects dates and closes them', async () => {
    const p = setup()
    await screen.findByText('Pokal')
    const buttons = screen.getAllByRole('button').filter(b => /2024|Datum wählen/.test(b.textContent || ''))
    fireEvent.click(buttons[0]) // Beginn
    fireEvent.click(screen.getByText('pick'))
    expect(p.onFormDataChange).toHaveBeenCalledWith('Beginn', new Date(2025, 2, 10))
    expect(screen.queryByText('pick')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button').filter(b => /Datum wählen/.test(b.textContent || ''))[0]) // Ende
    fireEvent.click(screen.getByText('pick'))
    expect(p.onFormDataChange).toHaveBeenCalledWith('Ende', new Date(2025, 2, 10))
  })

  it('does not report change when date selection is cleared but closes the calendar', async () => {
    const p = setup()
    await screen.findByText('Pokal')
    fireEvent.click(screen.getAllByRole('button').filter(b => /Datum wählen/.test(b.textContent || ''))[0])
    fireEvent.click(screen.getByText('pick-none'))
    expect(p.onFormDataChange).not.toHaveBeenCalled()
    expect(screen.queryByText('pick-none')).not.toBeInTheDocument()
  })

  it('disables inputs and prevents calendar when not editable', async () => {
    setup({ isEditable: false })
    await screen.findByText('Pokal')
    expect(screen.getByPlaceholderText('Bezeichnung')).toBeDisabled()
    expect(screen.getByPlaceholderText('Bemerkungen')).toBeDisabled()
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.getByTestId('typ-select')).toHaveAttribute('data-disabled', 'true')
    screen.getAllByRole('button').filter(b => /2024|Datum wählen/.test(b.textContent || '')).forEach(b => expect(b).toBeDisabled())
  })

  it('shows validation errors', async () => {
    setup({ validationErrors: { Bezeichnung: 'E1', Beginn: 'E2', Ende: 'E3', MeisterschaftstypID: 'E4', Bemerkungen: 'E5' } })
    for (const e of ['E1', 'E2', 'E3', 'E4', 'E5']) expect(screen.getByText(e)).toBeInTheDocument()
    await screen.findByText('Pokal')
  })

  it('survives a failing type loader', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(getMeisterschaftstypen as jest.Mock).mockRejectedValue(new Error('x'))
    setup()
    await waitFor(() => expect(screen.queryByText('Lade Meisterschaftstypen...')).not.toBeInTheDocument())
    expect(screen.queryByText('Pokal')).not.toBeInTheDocument()
    spy.mockRestore()
  })
})
