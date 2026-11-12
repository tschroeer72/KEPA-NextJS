import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VorlagenPage from '../page'
import { VorlagenData } from '@/data/vorlagen-data'

const origFetch = global.fetch

function mockOkFetch() {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) }) as any
}

describe('VorlagenPage', () => {
  let clickSpy: jest.SpyInstance
  beforeEach(() => {
    ;(window.URL as any).createObjectURL = jest.fn(() => 'blob:x')
    ;(window.URL as any).revokeObjectURL = jest.fn()
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    global.fetch = origFetch
    jest.restoreAllMocks()
  })

  it('renders groups and items from VorlagenData; PDF disabled until selection', () => {
    render(<VorlagenPage />)
    expect(screen.getByText('Vorlagen')).toBeInTheDocument()
    VorlagenData.forEach(g => {
      expect(screen.getByText(g.title)).toBeInTheDocument()
      g.subtitle.forEach(s => expect(screen.getByLabelText(s.subtitle)).toBeInTheDocument())
    })
    expect(screen.getByRole('button', { name: /PDF/ })).toBeDisabled()
  })

  it('downloads a template directly', async () => {
    mockOkFetch()
    render(<VorlagenPage />)
    fireEvent.click(screen.getByLabelText('6-Tage-Rennen'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/vorlagen/6-tage-rennen')
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
    await waitFor(() => expect(screen.getByRole('button', { name: /PDF/ })).toBeEnabled())
  })

  it('uses query-free file name for downloads', async () => {
    mockOkFetch()
    let createdLink: HTMLAnchorElement | undefined
    const orig = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tag: string, o?: any) => {
      const el = orig(tag, o)
      if (tag === 'a') createdLink = el as HTMLAnchorElement
      return el
    })
    render(<VorlagenPage />)
    fireEvent.click(screen.getByLabelText('Weihnachtsbaum Variante 1'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(createdLink!.download).toBe('weihnachtsbaum')
  })

  it.each([
    ['Meisterschaft', '/api/vorlagen/meisterschaft'],
    ['Blitztunier', '/api/vorlagen/blitztunier'],
  ])('opens the participants dialog for %s and downloads with anzahl', async (label, href) => {
    mockOkFetch()
    render(<VorlagenPage />)
    fireEvent.click(screen.getByLabelText(label))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    expect(global.fetch).not.toHaveBeenCalled()
    expect(await screen.findByText(`Für wieviele Teilnehmer soll die Vorlage "${label}" generiert werden?`)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Teilnehmer'), { target: { value: '8' } })
    fireEvent.click(screen.getByRole('button', { name: 'PDF Generieren' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(`${href}?anzahl=8`))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('survives a failed download (response not ok) and re-enables the button', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any
    render(<VorlagenPage />)
    fireEvent.click(screen.getByLabelText('6-Tage-Rennen'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(console.error).toHaveBeenCalled())
    expect(clickSpy).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: /PDF/ })).toBeEnabled())
  })

  it('survives a network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as any
    render(<VorlagenPage />)
    fireEvent.click(screen.getByLabelText('6-Tage-Rennen'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(console.error).toHaveBeenCalled())
    expect(clickSpy).not.toHaveBeenCalled()
  })
})
