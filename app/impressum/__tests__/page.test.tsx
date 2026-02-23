import { render, screen } from '@testing-library/react'
import Impressum from '../page'

describe('Impressum Page', () => {
  it('renders the heading and contact info', () => {
    render(<Impressum />)
    expect(screen.getByRole('heading', { name: /Impressum/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Thorsten Schröer/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/webmaster@kegelgruppe-kepa.de/i)).toBeInTheDocument()
  })

  it('contains the correct mailto link', () => {
    render(<Impressum />)
    const mailLink = screen.getByRole('link', { name: /webmaster@kegelgruppe-kepa.de/i })
    expect(mailLink).toHaveAttribute('href', 'mailto:webmaster@kegelgruppe-kepa.de')
  })
})
