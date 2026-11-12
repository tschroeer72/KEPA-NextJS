import { render, screen } from '@testing-library/react'
import KegelfahrtenPage from '../page'

jest.mock('../_components/kegelfahrten-liste', () => ({
  __esModule: true,
  default: () => <div data-testid="liste" />,
}))

it('renders heading and list', () => {
  render(<KegelfahrtenPage />)
  expect(screen.getByRole('heading', { name: 'Kegelfahrten' })).toBeInTheDocument()
  expect(screen.getByTestId('liste')).toBeInTheDocument()
})
