import { render, screen, fireEvent, within } from '@testing-library/react'
import Meisterschaftliste from '../meisterschaftliste'

const data: any[] = [
  { ID: 1, Bezeichnung: 'Beta', Beginn: new Date(2022, 0, 5), Ende: new Date(2022, 11, 1), MeisterschaftstypID: 1, Aktiv: 0, Bemerkungen: 'alt', tblMeisterschaftstyp: { Meisterschaftstyp: 'Liga' } },
  { ID: 2, Bezeichnung: 'Alpha', Beginn: new Date(2024, 0, 5), Ende: null, MeisterschaftstypID: 2, Aktiv: 1, Bemerkungen: null },
  { ID: 3, Bezeichnung: 'Gamma', Beginn: new Date(2023, 0, 5), Ende: new Date(2023, 5, 1), MeisterschaftstypID: 1, Aktiv: 0, tblMeisterschaftstyp: { Meisterschaftstyp: 'Pokal' } },
]

const names = () => screen.getAllByRole('row').slice(1).map(r => within(r).queryAllByRole('cell')[0]?.textContent)

describe('Meisterschaftliste', () => {
  it('renders rows sorted by Bezeichnung asc by default', () => {
    render(<Meisterschaftliste lstMeisterschaften={data} />)
    expect(screen.getByText('Meisterschaftenliste')).toBeInTheDocument()
    expect(names()).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('formats dates, type fallback and empty remarks', () => {
    render(<Meisterschaftliste lstMeisterschaften={data} />)
    const alpha = screen.getByText('Alpha').closest('tr')!
    const cells = within(alpha).getAllByRole('cell')
    expect(cells[1]).toHaveTextContent(new Date(2024, 0, 5).toLocaleDateString('de-DE'))
    expect(cells[2]).toHaveTextContent('-')
    expect(cells[3]).toHaveTextContent('-')
    expect(cells[5]).toHaveTextContent('-')
    expect(within(alpha).getByRole('checkbox')).toBeChecked()
    const beta = screen.getByText('Beta').closest('tr')!
    expect(within(beta).getByText('Liga')).toBeInTheDocument()
    expect(within(beta).getByRole('checkbox')).not.toBeChecked()
    expect(within(beta).getByText('alt')).toHaveAttribute('title', 'alt')
  })

  it('toggles sorting when clicking a header', () => {
    render(<Meisterschaftliste lstMeisterschaften={data} />)
    fireEvent.click(screen.getByRole('button', { name: 'Bezeichnung' }))
    expect(names()).toEqual(['Gamma', 'Beta', 'Alpha'])
    fireEvent.click(screen.getByRole('button', { name: 'Beginn' }))
    expect(names()).toEqual(['Beta', 'Gamma', 'Alpha'])
    fireEvent.click(screen.getByRole('button', { name: 'Ende' }))
    expect(screen.getAllByRole('row').length).toBe(4)
  })

  it('filters by Bezeichnung and clears the filter', () => {
    render(<Meisterschaftliste lstMeisterschaften={data} />)
    const input = screen.getByPlaceholderText('Bezeichnung filtern...')
    fireEvent.change(input, { target: { value: 'gam' } })
    expect(names()).toEqual(['Gamma'])
    // clear button appears (only button in header area besides sort buttons)
    const clear = screen.getAllByRole('button').find(b => b.className.includes('absolute'))!
    fireEvent.click(clear)
    expect(names()).toEqual(['Alpha', 'Beta', 'Gamma'])
    expect(screen.queryAllByRole('button').find(b => b.className.includes('absolute'))).toBeUndefined()
  })

  it('shows empty text when nothing matches or no data', () => {
    const { rerender } = render(<Meisterschaftliste lstMeisterschaften={[]} />)
    expect(screen.getByText('Keine Meisterschaften vorhanden')).toBeInTheDocument()
    rerender(<Meisterschaftliste lstMeisterschaften={data} />)
    fireEvent.change(screen.getByPlaceholderText('Bezeichnung filtern...'), { target: { value: 'zzz' } })
    expect(screen.getByText('Keine Meisterschaften vorhanden')).toBeInTheDocument()
  })

  it('calls onMeisterschaftSelect and highlights selected row', () => {
    const onSelect = jest.fn()
    render(<Meisterschaftliste lstMeisterschaften={data} onMeisterschaftSelect={onSelect} />)
    const row = screen.getByText('Beta').closest('tr')!
    fireEvent.click(row)
    expect(onSelect).toHaveBeenCalledWith(1)
    expect(row.className).toContain('bg-muted')
  })

  it('works without onMeisterschaftSelect', () => {
    render(<Meisterschaftliste lstMeisterschaften={data} />)
    fireEvent.click(screen.getByText('Beta').closest('tr')!)
    expect(screen.getByText('Beta').closest('tr')!.className).toContain('bg-muted')
  })
})
