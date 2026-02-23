import { render } from '@testing-library/react'
import Divider from '../devider'

describe('Divider Component', () => {
  it('renders correctly', () => {
    const { container } = render(<Divider />)
    expect(container.firstChild).toHaveClass('h-px w-full')
  })
})
