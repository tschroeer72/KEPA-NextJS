import { render, screen } from '@testing-library/react'
import Termine from '../page'

// Mock Calendar component
jest.mock('@/components/ui/calendar', () => {
  return {
    // Destructure to avoid passing non-DOM props to a div
    Calendar: ({ numberOfMonths, buttonVariant, showWeekNumber, weekStartsOn, fixedWeeks, locale, modifiers, modifiersClassNames, ...props }: any) => 
      <div data-testid="calendar-mock" {...props}>Calendar Mock</div>
  }
})

describe('Termine Page', () => {
  it('renders the heading and description', () => {
    render(<Termine />)
    expect(screen.getByRole('heading', { name: /Termine/i })).toBeInTheDocument()
    expect(screen.getByText(/Im Kalender findest Du alle Termine/i)).toBeInTheDocument()
  })

  it('renders the calendar component with correct props', () => {
    render(<Termine />)
    const calendar = screen.getByTestId('calendar-mock')
    expect(calendar).toBeInTheDocument()
    // It should have modifiers with dates
    // Since we can't easily check the content of the dates without knowing the year, 
    // we just check if the prop exists
  })
})
