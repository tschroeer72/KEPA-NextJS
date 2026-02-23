import { render, screen } from '@testing-library/react'
import RootLayout from '../layout'

// Mock sub-components
jest.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => <>{children}</>
}))
jest.mock('@/providers/auth-context-provider', () => ({
  AuthContextProvider: ({ children }: any) => <>{children}</>
}))
jest.mock('@/components/conditional-layout', () => {
  return ({ children }: any) => <>{children}</>
})
jest.mock('@/components/ui/sonner', () => ({
  Toaster: () => <div data-testid="toaster" />
}))
jest.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="analytics" />
}))
jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />
}))

// Mock fonts
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'geist-sans' }),
  Geist_Mono: () => ({ variable: 'geist-mono' }),
}))

describe('RootLayout', () => {
  it('renders correctly with children', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <RootLayout>
        <div data-testid="test-child">Child</div>
      </RootLayout>
    )
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument()

    errorSpy.mockRestore()
  })
})
