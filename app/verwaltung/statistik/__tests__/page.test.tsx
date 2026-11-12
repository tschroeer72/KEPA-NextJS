import { render, screen } from '@testing-library/react'
import StatistikPage from '../page'

jest.mock('../_components/statistik-content', () => ({
  StatistikContent: () => <div data-testid="content">Content</div>,
}))

describe('StatistikPage', () => {
  it('renders heading and content', () => {
    render(<StatistikPage />)
    expect(screen.getByRole('heading', { name: 'Statistik' })).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })
})
