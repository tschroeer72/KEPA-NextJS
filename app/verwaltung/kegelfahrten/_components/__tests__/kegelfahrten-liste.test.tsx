import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import KegelfahrtenListe from '../kegelfahrten-liste'
import { getKegelfahrten } from '@/app/actions/verwaltung/kegelfahrten/get-kegelfahrten'

const push = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
jest.mock('@/app/actions/verwaltung/kegelfahrten/get-kegelfahrten', () => ({ getKegelfahrten: jest.fn() }))
jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Ctx = React.createContext({})
  return {
    Select: ({ onValueChange, children }: any) => <Ctx.Provider value={{ onValueChange }}>{children}</Ctx.Provider>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const c: any = React.useContext(Ctx)
      return <button data-testid={`sort-${value}`} onClick={() => c.onValueChange(value)}>{children}</button>
    },
  }
})

const data = [
  { ID: 1, Jahr: 2019, Ziel: 'Berlin', Von: new Date(2019, 4, 1), Bis: new Date(2019, 4, 3), Dateiname: 'a.mp4' },
  { ID: 2, Jahr: 2022, Ziel: 'Aachen', Von: new Date(2022, 5, 1), Bis: new Date(2022, 5, 5), Dateiname: 'b.mp4' },
  { ID: 3, Jahr: 2021, Ziel: 'Zürich', Von: new Date(2021, 5, 1), Bis: new Date(2021, 5, 5), Dateiname: 'c.mp4' },
]
const titles = () => screen.getAllByText(/^(Berlin|Aachen|Zürich)$/).map(e => e.textContent)

describe('KegelfahrtenListe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getKegelfahrten as jest.Mock).mockResolvedValue(data)
  })

  it('shows loading then list sorted by Jahr desc with date range', async () => {
    render(<KegelfahrtenListe />)
    expect(screen.getByText('Lade Kegelfahrten...')).toBeInTheDocument()
    await waitFor(() => expect(titles()).toEqual(['Aachen', 'Zürich', 'Berlin']))
    expect(screen.getByText(`Zeitraum: ${new Date(2019, 4, 1).toLocaleDateString('de-DE')} - ${new Date(2019, 4, 3).toLocaleDateString('de-DE')}`)).toBeInTheDocument()
  })

  it('toggles sort order and sorts by Ziel', async () => {
    render(<KegelfahrtenListe />)
    await waitFor(() => titles())
    // order toggle is the outline icon button right after the sort select items
    const toggle = screen.getByTestId('sort-Ziel').parentElement!.parentElement!.parentElement!.querySelector(':scope > button') as HTMLElement
    fireEvent.click(toggle)
    expect(titles()).toEqual(['Berlin', 'Zürich', 'Aachen'])
    fireEvent.click(screen.getByTestId('sort-Ziel'))
    expect(titles()).toEqual(['Aachen', 'Berlin', 'Zürich'])
  })

  it('filters by Ziel and Jahr, shows empty message', async () => {
    render(<KegelfahrtenListe />)
    await waitFor(() => titles())
    const input = screen.getByPlaceholderText('Filtern nach Jahr oder Ziel...')
    fireEvent.change(input, { target: { value: 'ber' } })
    expect(titles()).toEqual(['Berlin'])
    fireEvent.change(input, { target: { value: '2021' } })
    expect(titles()).toEqual(['Zürich'])
    fireEvent.change(input, { target: { value: 'nix' } })
    expect(screen.getByText('Keine Kegelfahrten gefunden.')).toBeInTheDocument()
  })

  it('navigates to detail page on play', async () => {
    render(<KegelfahrtenListe />)
    await waitFor(() => titles())
    const header = screen.getByText('Berlin').closest('[data-slot="card-header"]') as HTMLElement
    fireEvent.click(header.querySelector('button')!)
    expect(push).toHaveBeenCalledWith('/verwaltung/kegelfahrten/1')
  })

  it('handles load error by showing empty list', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(getKegelfahrten as jest.Mock).mockRejectedValue(new Error('x'))
    render(<KegelfahrtenListe />)
    await waitFor(() => expect(screen.getByText('Keine Kegelfahrten gefunden.')).toBeInTheDocument())
    spy.mockRestore()
  })
})
