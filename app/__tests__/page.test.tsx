import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', {
      name: /Herzlich Willkommen bei KEPA/i,
    })
    expect(heading).toBeInTheDocument()
  })

  it('renders the logo image with correct alt text', () => {
    render(<Home />)
    const logo = screen.getByAltText(/Vereinspokal Logo/i)
    expect(logo).toBeInTheDocument()
  })
})
