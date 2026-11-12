import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StatistikContent } from '../statistik-content'
import { getMeisterschaften } from '@/app/actions/verwaltung/common/actions'
import { toast } from 'sonner'

jest.mock('@/app/actions/verwaltung/common/actions', () => ({
  getMeisterschaften: jest.fn(),
}))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('../zeitbereich-auswahl', () => ({
  ZeitbereichAuswahl: (p: any) => (
    <div>
      <span data-testid="zeit">{p.zeit}</span>
      <span data-testid="ms">{p.selectedMeisterschaftId}</span>
      <span data-testid="ms-count">{p.meisterschaften.length}</span>
      <button onClick={() => p.setZeit('gesamt')}>zeit-gesamt</button>
      <button onClick={() => p.setZeit('individuell')}>zeit-ind</button>
      <button onClick={() => p.setDateVon(new Date(2024, 0, 1))}>von</button>
      <button onClick={() => p.setDateBis(new Date(2024, 11, 31))}>bis</button>
      <button onClick={() => p.setSelectedMeisterschaftId('7')}>ms-7</button>
    </div>
  ),
}))
jest.mock('../statistik-auswahl', () => ({
  StatistikAuswahl: (p: any) => (
    <div>
      <span data-testid="auswahl">{p.value}</span>
      <button onClick={() => p.onValueChange('sarg')}>sarg</button>
    </div>
  ),
}))

const mockMs = getMeisterschaften as jest.Mock
const origFetch = global.fetch

describe('StatistikContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockMs.mockResolvedValue([{ ID: 3, Bezeichnung: 'A' }, { ID: 4, Bezeichnung: 'B' }])
    ;(window.URL as any).createObjectURL = jest.fn(() => 'blob:x')
    ;(window.URL as any).revokeObjectURL = jest.fn()
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    global.fetch = origFetch
    jest.restoreAllMocks()
  })

  it('loads championships and preselects the first one', async () => {
    render(<StatistikContent />)
    await waitFor(() => expect(screen.getByTestId('ms')).toHaveTextContent('3'))
    expect(screen.getByTestId('ms-count')).toHaveTextContent('2')
    expect(screen.getByTestId('zeit')).toHaveTextContent('laufende')
    expect(screen.getByTestId('auswahl')).toHaveTextContent('neuner')
  })

  it('handles an empty championship list', async () => {
    mockMs.mockResolvedValue([])
    render(<StatistikContent />)
    await waitFor(() => expect(mockMs).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByTestId('ms-count')).toHaveTextContent('0'))
    expect(screen.getByTestId('ms')).toHaveTextContent('')
  })

  it('exports the PDF for the running championship', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) }) as any
    render(<StatistikContent />)
    await waitFor(() => expect(screen.getByTestId('ms')).toHaveTextContent('3'))
    fireEvent.click(screen.getByText('sarg'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/statistik/pdf')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toEqual({ auswahl: 'sarg', zeit: 'laufende', meisterschaftId: '3' })
    await waitFor(() => expect(screen.getByRole('button', { name: /PDF/ })).toBeEnabled())
    expect(window.URL.revokeObjectURL).toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('sends date range and omits championship id for non-"laufende" ranges', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x']) }) as any
    render(<StatistikContent />)
    await waitFor(() => expect(screen.getByTestId('ms')).toHaveTextContent('3'))
    fireEvent.click(screen.getByText('zeit-ind'))
    fireEvent.click(screen.getByText('von'))
    fireEvent.click(screen.getByText('bis'))
    fireEvent.click(screen.getByText('ms-7'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.zeit).toBe('individuell')
    expect(new Date(body.dateVon).getFullYear()).toBe(2024)
    expect(new Date(body.dateBis).getMonth()).toBe(11)
    expect(body.meisterschaftId).toBeUndefined()
  })

  it('shows loading label while exporting', async () => {
    let resolve!: (v: any) => void
    global.fetch = jest.fn().mockReturnValue(new Promise(r => { resolve = r })) as any
    render(<StatistikContent />)
    await waitFor(() => expect(screen.getByTestId('ms')).toHaveTextContent('3'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    const busy = await screen.findByRole('button', { name: /Wird erstellt/ })
    expect(busy).toBeDisabled()
    resolve({ ok: true, blob: async () => new Blob(['x']) })
    await waitFor(() => expect(screen.getByRole('button', { name: /PDF/ })).toBeEnabled())
  })

  it('shows an error toast when the export response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any
    render(<StatistikContent />)
    await waitFor(() => expect(screen.getByTestId('ms')).toHaveTextContent('3'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Der PDF-Export ist fehlgeschlagen.'))
  })

  it('shows an error toast when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as any
    render(<StatistikContent />)
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Der PDF-Export ist fehlgeschlagen.'))
  })
})
