import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import KegelfahrtVideoPage from '../page'
import { getKegelfahrtById } from '@/app/actions/verwaltung/kegelfahrten/get-kegelfahrt-by-id'
import { getFreigabeUrl } from '@/app/actions/verwaltung/kegelfahrten/get-freigabe-url'

const back = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ back }) }))
jest.mock('@/app/actions/verwaltung/kegelfahrten/get-kegelfahrt-by-id', () => ({ getKegelfahrtById: jest.fn() }))
jest.mock('@/app/actions/verwaltung/kegelfahrten/get-freigabe-url', () => ({ getFreigabeUrl: jest.fn() }))

const playerProps: any[] = []
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => (props: any) => {
    playerProps.push(props)
    return (
      <div data-testid="player" data-src={props.src}>
        <button onClick={() => props.onError({ target: { error: { code: 4, message: 'm' } } })}>fail</button>
      </div>
    )
  },
}))

async function renderPage(id = '7') {
  await act(async () => {
    render(<KegelfahrtVideoPage params={Promise.resolve({ id })} />)
  })
}

describe('KegelfahrtVideoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    playerProps.length = 0
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => (console.error as jest.Mock).mockRestore())

  it('plays direct video links with encoded URL built from freigabe base', async () => {
    ;(getKegelfahrtById as jest.Mock).mockResolvedValue({ ID: 7, Jahr: 2020, Ziel: 'Prag', Dateiname: 'Prag 2020.mp4' })
    ;(getFreigabeUrl as jest.Mock).mockResolvedValue('http://nas/share/')
    await renderPage()
    await waitFor(() => expect(screen.getByTestId('player')).toBeInTheDocument())
    expect(getKegelfahrtById).toHaveBeenCalledWith(7)
    expect(screen.getByText('Prag (2020)')).toBeInTheDocument()
    expect(screen.getByTestId('player')).toHaveAttribute('data-src', 'http://nas/share/Prag%202020.mp4')
    expect(playerProps[0]).toMatchObject({ controls: true, playing: true })
  })

  it('offers an external link for non-direct files', async () => {
    ;(getKegelfahrtById as jest.Mock).mockResolvedValue({ ID: 7, Jahr: 2020, Ziel: 'Prag', Dateiname: 'film.mkv' })
    ;(getFreigabeUrl as jest.Mock).mockResolvedValue('http://nas/share')
    await renderPage()
    const link = await screen.findByRole('link', { name: /neuem Fenster/ })
    expect(link).toHaveAttribute('href', 'http://nas/share/film.mkv')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.queryByTestId('player')).not.toBeInTheDocument()
  })

  it('shows error when player fails', async () => {
    ;(getKegelfahrtById as jest.Mock).mockResolvedValue({ ID: 7, Jahr: 2020, Ziel: 'Prag', Dateiname: 'a.webm' })
    ;(getFreigabeUrl as jest.Mock).mockResolvedValue('http://nas')
    await renderPage()
    fireEvent.click(await screen.findByText('fail'))
    expect(await screen.findByText(/konnte nicht abgespielt werden/)).toBeInTheDocument()
  })

  it('shows not-found message and back button', async () => {
    ;(getKegelfahrtById as jest.Mock).mockResolvedValue(null)
    ;(getFreigabeUrl as jest.Mock).mockResolvedValue('http://nas')
    await renderPage()
    expect(await screen.findByText('Kegelfahrt nicht gefunden.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Zurück zur Liste/ }))
    expect(back).toHaveBeenCalled()
  })

  it('shows load error when action rejects', async () => {
    ;(getKegelfahrtById as jest.Mock).mockRejectedValue(new Error('boom'))
    ;(getFreigabeUrl as jest.Mock).mockResolvedValue('http://nas')
    await renderPage()
    expect(await screen.findByText('Fehler beim Laden der Daten.')).toBeInTheDocument()
  })

  it('back button works on video view', async () => {
    ;(getKegelfahrtById as jest.Mock).mockResolvedValue({ ID: 7, Jahr: 2020, Ziel: 'Prag', Dateiname: 'a.mp4' })
    ;(getFreigabeUrl as jest.Mock).mockResolvedValue('http://nas')
    await renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Zurück/ }))
    expect(back).toHaveBeenCalled()
  })
})
