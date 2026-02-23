import { render, screen } from '@testing-library/react'
import Footer from '../footer'

describe('Footer Component', () => {
  it('renders the copyright text with current year', () => {
    const currentYear = new Date().getFullYear()
    render(<Footer />)
    expect(screen.getByText(new RegExp(`© ${currentYear}`, 'i'))).toBeInTheDocument()
    expect(screen.getByText(/Kegelgruppe KEPA/i)).toBeInTheDocument()
    expect(screen.getByText(/Powered by Thorsten Schröer/i)).toBeInTheDocument()
  })

  it('renders the Impressum link', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: /Impressum/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/impressum')
  })
})
