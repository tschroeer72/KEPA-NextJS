import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import Mitspieler from '../mitspieler'
import { getAktiveMitglieder } from '@/app/actions/verwaltung/mitglieder/actions'
import {
  getTeilnehmerByMeisterschaft,
  addTeilnehmer,
  removeTeilnehmer,
  updateTeilnehmerNurHinrunde,
} from '@/app/actions/verwaltung/meisterschaften/actions'

jest.mock('@/app/actions/verwaltung/mitglieder/actions', () => ({ getAktiveMitglieder: jest.fn() }))
jest.mock('@/app/actions/verwaltung/meisterschaften/actions', () => ({
  getTeilnehmerByMeisterschaft: jest.fn(),
  addTeilnehmer: jest.fn(),
  removeTeilnehmer: jest.fn(),
  updateTeilnehmerNurHinrunde: jest.fn(),
}))

const m = (ID: number, Vorname: string, extra: any = {}) => ({ ID, Vorname: 'V' + Vorname, Nachname: 'N' + ID, Spitzname: 'S' + ID, Anzeigename: Vorname, ...extra })

const mitglieder = [m(1, 'Anna'), m(2, 'Bert'), m(3, 'Cora')]
const teilnehmer = [m(3, 'Cora', { NurHinrunde: false }), m(4, 'Dirk', { NurHinrunde: true })]

async function renderLoaded() {
  render(<Mitspieler meisterschaftID={9} />)
  await screen.findByText('Aktive Mitglieder')
}
const rowOf = (name: string) => screen.getByText(name).closest('tr') as HTMLElement

describe('Mitspieler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    ;(getAktiveMitglieder as jest.Mock).mockResolvedValue({ success: true, data: mitglieder })
    ;(getTeilnehmerByMeisterschaft as jest.Mock).mockResolvedValue({ success: true, data: teilnehmer })
  })
  afterEach(() => (console.log as jest.Mock).mockRestore())

  it('shows loading then both tables, members exclude participants', async () => {
    render(<Mitspieler meisterschaftID={9} />)
    expect(screen.getByText('Lade Teilnehmer...')).toBeInTheDocument()
    await screen.findByText('Aktive Mitglieder')
    expect(getTeilnehmerByMeisterschaft).toHaveBeenCalledWith(9)
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Bert')).toBeInTheDocument()
    // Cora only appears once (as participant)
    expect(screen.getAllByText('Cora')).toHaveLength(1)
    expect(screen.getByText('Dirk')).toBeInTheDocument()
    expect(within(rowOf('Dirk')).getByRole('checkbox')).toBeChecked()
    expect(within(rowOf('Cora')).getByRole('checkbox')).not.toBeChecked()
  })

  it('shows error from loading', async () => {
    ;(getAktiveMitglieder as jest.Mock).mockResolvedValue({ success: false, error: 'nope' })
    render(<Mitspieler meisterschaftID={9} />)
    expect(await screen.findByText('Fehler: nope')).toBeInTheDocument()
  })

  it('shows error when loading throws', async () => {
    ;(getAktiveMitglieder as jest.Mock).mockRejectedValue(new Error('kaputt'))
    render(<Mitspieler meisterschaftID={9} />)
    expect(await screen.findByText('Fehler: kaputt')).toBeInTheDocument()
  })

  it('shows default error when no message', async () => {
    ;(getAktiveMitglieder as jest.Mock).mockResolvedValue({ success: false })
    ;(getTeilnehmerByMeisterschaft as jest.Mock).mockResolvedValue({ success: false })
    render(<Mitspieler meisterschaftID={9} />)
    expect(await screen.findByText('Fehler: Fehler beim Laden der Daten')).toBeInTheDocument()
  })

  it('adds a member as participant via plus button', async () => {
    ;(addTeilnehmer as jest.Mock).mockResolvedValue({ success: true })
    await renderLoaded()
    fireEvent.click(within(rowOf('Anna')).getByTitle('Zu Teilnehmern hinzufügen'))
    await waitFor(() => expect(addTeilnehmer).toHaveBeenCalledWith(9, 1))
    await waitFor(() => expect(screen.getAllByText('Anna')).toHaveLength(1))
    // now in participant table, with unchecked NurHinrunde
    expect(within(rowOf('Anna')).getByTitle('Von Teilnehmern entfernen')).toBeInTheDocument()
  })

  it('rolls back and shows error when add fails', async () => {
    ;(addTeilnehmer as jest.Mock).mockResolvedValue({ success: false, error: 'add failed' })
    await renderLoaded()
    fireEvent.click(within(rowOf('Anna')).getByTitle('Zu Teilnehmern hinzufügen'))
    expect(await screen.findByText('Fehler: add failed')).toBeInTheDocument()
  })

  it('shows error when add throws', async () => {
    ;(addTeilnehmer as jest.Mock).mockRejectedValue(new Error('boom'))
    await renderLoaded()
    fireEvent.click(within(rowOf('Anna')).getByTitle('Zu Teilnehmern hinzufügen'))
    expect(await screen.findByText('Fehler: boom')).toBeInTheDocument()
  })

  it('removes participant (deleted) back to members', async () => {
    ;(removeTeilnehmer as jest.Mock).mockResolvedValue({ success: true, action: 'deleted' })
    await renderLoaded()
    fireEvent.click(within(rowOf('Cora')).getByTitle('Von Teilnehmern entfernen'))
    await waitFor(() => expect(removeTeilnehmer).toHaveBeenCalledWith(9, 3))
    await waitFor(() => expect(within(rowOf('Cora')).getByTitle('Zu Teilnehmern hinzufügen')).toBeInTheDocument())
  })

  it('marks participant as NurHinrunde when action is marked', async () => {
    ;(removeTeilnehmer as jest.Mock).mockResolvedValue({ success: true, action: 'marked' })
    await renderLoaded()
    fireEvent.click(within(rowOf('Cora')).getByTitle('Von Teilnehmern entfernen'))
    await waitFor(() => expect(within(rowOf('Cora')).getByRole('checkbox')).toBeChecked())
    expect(within(rowOf('Cora')).getByTitle('Von Teilnehmern entfernen')).toBeInTheDocument()
  })

  it('shows error when remove fails or throws', async () => {
    ;(removeTeilnehmer as jest.Mock).mockResolvedValue({ success: false, error: 'rm failed' })
    await renderLoaded()
    fireEvent.click(within(rowOf('Cora')).getByTitle('Von Teilnehmern entfernen'))
    expect(await screen.findByText('Fehler: rm failed')).toBeInTheDocument()
  })

  it('shows error when remove throws', async () => {
    ;(removeTeilnehmer as jest.Mock).mockRejectedValue(new Error('rm boom'))
    await renderLoaded()
    fireEvent.click(within(rowOf('Cora')).getByTitle('Von Teilnehmern entfernen'))
    expect(await screen.findByText('Fehler: rm boom')).toBeInTheDocument()
  })

  it('can uncheck NurHinrunde (true -> false) but not check it', async () => {
    ;(updateTeilnehmerNurHinrunde as jest.Mock).mockResolvedValue({ success: true })
    await renderLoaded()
    // false -> true is ignored
    fireEvent.click(within(rowOf('Cora')).getByRole('checkbox'))
    expect(updateTeilnehmerNurHinrunde).not.toHaveBeenCalled()
    // true -> false is sent
    fireEvent.click(within(rowOf('Dirk')).getByRole('checkbox'))
    await waitFor(() => expect(updateTeilnehmerNurHinrunde).toHaveBeenCalledWith(9, 4, false))
    await waitFor(() => expect(within(rowOf('Dirk')).getByRole('checkbox')).not.toBeChecked())
  })

  it('shows error when NurHinrunde update fails or throws', async () => {
    ;(updateTeilnehmerNurHinrunde as jest.Mock).mockResolvedValue({ success: false, error: 'upd failed' })
    await renderLoaded()
    fireEvent.click(within(rowOf('Dirk')).getByRole('checkbox'))
    expect(await screen.findByText('Fehler: upd failed')).toBeInTheDocument()
  })

  it('shows error when NurHinrunde update throws', async () => {
    ;(updateTeilnehmerNurHinrunde as jest.Mock).mockRejectedValue(new Error('upd boom'))
    await renderLoaded()
    fireEvent.click(within(rowOf('Dirk')).getByRole('checkbox'))
    expect(await screen.findByText('Fehler: upd boom')).toBeInTheDocument()
  })

  it('moves a member to participants with drag and drop', async () => {
    ;(addTeilnehmer as jest.Mock).mockResolvedValue({ success: true })
    await renderLoaded()
    const target = screen.getByText('Aktive Spieler').closest('[data-slot="card"]') as HTMLElement
    fireEvent.dragStart(rowOf('Bert'))
    expect(screen.getByText(/Ziehe/)).toBeInTheDocument()
    fireEvent.dragOver(target)
    fireEvent.drop(target)
    await waitFor(() => expect(addTeilnehmer).toHaveBeenCalledWith(9, 2))
    await waitFor(() => expect(screen.queryByText(/Ziehe/)).not.toBeInTheDocument())
  })

  it('moves a participant to members with drag and drop', async () => {
    ;(removeTeilnehmer as jest.Mock).mockResolvedValue({ success: true, action: 'deleted' })
    await renderLoaded()
    const target = screen.getByText('Aktive Mitglieder').closest('[data-slot="card"]') as HTMLElement
    fireEvent.dragStart(rowOf('Cora'))
    fireEvent.drop(target)
    await waitFor(() => expect(removeTeilnehmer).toHaveBeenCalledWith(9, 3))
  })

  it('ignores drop onto the same table and drop without drag', async () => {
    await renderLoaded()
    const members = screen.getByText('Aktive Mitglieder').closest('[data-slot="card"]') as HTMLElement
    fireEvent.drop(members) // nothing dragged
    fireEvent.dragStart(rowOf('Bert'))
    fireEvent.drop(members)
    expect(addTeilnehmer).not.toHaveBeenCalled()
    expect(screen.queryByText(/Ziehe/)).not.toBeInTheDocument()
  })

  it('resets drag state on dragEnd and handles dragLeave', async () => {
    await renderLoaded()
    const target = screen.getByText('Aktive Spieler').closest('[data-slot="card"]') as HTMLElement
    fireEvent.dragStart(rowOf('Bert'))
    fireEvent.dragOver(target)
    expect(target.className).toContain('ring-2')
    fireEvent.dragLeave(target)
    fireEvent.dragEnd(rowOf('Bert'))
    expect(target.className).not.toContain('ring-2')
    expect(screen.queryByText(/Ziehe/)).not.toBeInTheDocument()
  })

  it('shows empty placeholders', async () => {
    ;(getAktiveMitglieder as jest.Mock).mockResolvedValue({ success: true, data: [] })
    ;(getTeilnehmerByMeisterschaft as jest.Mock).mockResolvedValue({ success: true, data: [] })
    await renderLoaded()
    expect(screen.getByText('Keine aktiven Mitglieder')).toBeInTheDocument()
    expect(screen.getByText('Keine aktiven Spieler')).toBeInTheDocument()
  })

  it('reloads when meisterschaftID changes', async () => {
    const { rerender } = render(<Mitspieler meisterschaftID={9} />)
    await screen.findByText('Aktive Mitglieder')
    rerender(<Mitspieler meisterschaftID={10} />)
    await waitFor(() => expect(getTeilnehmerByMeisterschaft).toHaveBeenCalledWith(10))
  })
})
