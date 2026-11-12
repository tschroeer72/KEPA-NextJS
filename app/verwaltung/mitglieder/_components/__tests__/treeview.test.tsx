import { render, screen, fireEvent } from '@testing-library/react'
import Treeview from '../treeview'

const list = [
  { ID: 1, Vorname: 'Anna', Nachname: 'Adam', Ehemaliger: false },
  { ID: 2, Vorname: 'Bert', Nachname: 'Adler', Ehemaliger: true },
  { ID: 3, Vorname: 'Carl', Nachname: 'Berg', Ehemaliger: false },
]

describe('Treeview', () => {
  it('groups active members by first letter of last name', () => {
    render(<Treeview lstMitglieder={list} />)
    expect(screen.getByText('A (1)')).toBeInTheDocument()
    expect(screen.getByText('B (1)')).toBeInTheDocument()
  })

  it('expands, selects and collapses nodes', () => {
    const onSelect = jest.fn()
    render(<Treeview lstMitglieder={list} onMemberSelect={onSelect} />)
    expect(screen.queryByText('Adam, Anna')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('A (1)'))
    fireEvent.click(screen.getByText('Adam, Anna'))
    expect(onSelect).toHaveBeenCalledWith(1)
    fireEvent.click(screen.getByText('A (1)'))
    expect(screen.queryByText('Adam, Anna')).not.toBeInTheDocument()
  })

  it('works without onMemberSelect', () => {
    render(<Treeview lstMitglieder={list} />)
    fireEvent.click(screen.getByText('A (1)'))
    fireEvent.click(screen.getByText('Adam, Anna'))
  })

  it('includes former members with the "Alle" filter', () => {
    render(<Treeview lstMitglieder={list} />)
    fireEvent.click(screen.getByLabelText('Alle Mitglieder'))
    expect(screen.getByText('A (2)')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Nur aktive Mitglieder'))
    expect(screen.getByText('A (1)')).toBeInTheDocument()
  })

  it('filters by search term (case-insensitive, first or last name)', () => {
    render(<Treeview lstMitglieder={list} />)
    fireEvent.change(screen.getByPlaceholderText('Suche nach Name...'), { target: { value: 'carl' } })
    expect(screen.queryByText('A (1)')).not.toBeInTheDocument()
    expect(screen.getByText('B (1)')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Suche nach Name...'), { target: { value: 'ADAM' } })
    expect(screen.getByText('A (1)')).toBeInTheDocument()
  })
})
