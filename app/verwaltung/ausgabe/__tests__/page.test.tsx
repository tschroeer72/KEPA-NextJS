import { render, screen } from '@testing-library/react'
import AusgabePage from '../page'
import { getMeisterschaften } from '@/app/actions/verwaltung/common/actions'

jest.mock('@/app/actions/verwaltung/common/actions', () => ({
  getMeisterschaften: jest.fn(),
}))
const mockContent = jest.fn()
jest.mock('../_components/ausgabe-content', () => ({
  AusgabeContent: (props: any) => {
    mockContent(props)
    return <div data-testid="ausgabe-content" />
  },
}))

describe('AusgabePage', () => {
  it('renders heading and passes Meisterschaften', async () => {
    const list = [{ ID: 1, Bezeichnung: 'X' }]
    ;(getMeisterschaften as jest.Mock).mockResolvedValue(list)
    render(await AusgabePage())
    expect(screen.getByRole('heading', { name: 'Spielergebnisse' })).toBeInTheDocument()
    expect(screen.getByTestId('ausgabe-content')).toBeInTheDocument()
    expect(mockContent).toHaveBeenCalledWith({ meisterschaften: list })
  })
})
