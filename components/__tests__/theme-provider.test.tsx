import { render } from '@testing-library/react'
import ThemeProvider from '../theme-provider'

describe('ThemeProvider Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Child</div>
      </ThemeProvider>
    )
    expect(getByText('Test Child')).toBeInTheDocument()
  })
})
