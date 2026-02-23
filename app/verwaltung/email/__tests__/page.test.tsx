import { render, screen } from '@testing-library/react'
import EmailPage from '../page'

jest.mock('../_components/rund-email', () => ({
  RundEmail: () => <div data-testid="rund-email">RundEmail</div>
}))
jest.mock('../_components/email-entwickler', () => ({
  EmailEntwickler: () => <div data-testid="email-entwickler">EmailEntwickler</div>
}))

describe('EmailPage', () => {
  it('renders heading and tabs', () => {
    render(<EmailPage />)
    expect(screen.getByRole('heading', { name: /Emailversand/i })).toBeInTheDocument()
    expect(screen.getByText('Rund-Email')).toBeInTheDocument()
    expect(screen.getByText('E-Mail an Entwickler')).toBeInTheDocument()
    expect(screen.getByTestId('rund-email')).toBeInTheDocument()
  })
})
