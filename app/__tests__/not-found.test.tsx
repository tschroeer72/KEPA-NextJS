import { render, screen } from '@testing-library/react'
import NotFound from '../not-found'

describe('NotFound Page', () => {
  it('renders not found message and back link', () => {
    render(<NotFound />)
    expect(screen.getByText(/Seite nicht gefunden/i)).toBeInTheDocument()
    expect(screen.getByText(/Leider konnten wir die von Ihnen gesuchte Seite nicht finden/i)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Zurück zur Homepage/i })
    expect(link).toHaveAttribute('href', '/')
  })
})
