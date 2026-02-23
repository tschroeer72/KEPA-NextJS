import { render, screen } from '@testing-library/react'
import VerwaltungPage from '../page'

describe('VerwaltungPage', () => {
  it('renders the heading and logo', () => {
    render(<VerwaltungPage />)
    expect(screen.getByRole('heading', { name: /Verwaltung/i })).toBeInTheDocument()
    expect(screen.getByAltText(/Vereinspokal Logo/i)).toBeInTheDocument()
  })
})
