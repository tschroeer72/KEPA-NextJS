import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import ErgebniseingabeCard from '../ergebniseingabe-card'
import { saveEingabeAction } from '@/app/actions/verwaltung/eingabe'
import { deleteEingabeRowAction } from '@/app/actions/verwaltung/eingabe/delete-eingabe-row'
import { toast } from 'sonner'

jest.mock('@/app/actions/verwaltung/eingabe', () => ({ saveEingabeAction: jest.fn() }))
jest.mock('@/app/actions/verwaltung/eingabe/delete-eingabe-row', () => ({ deleteEingabeRowAction: jest.fn() }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() } }))
jest.mock('@/components/ui/select', () => {
  const React = require('react')
  const Ctx = React.createContext({})
  return {
    Select: ({ onValueChange, value, disabled, children }: any) => (
      <Ctx.Provider value={{ onValueChange }}>
        <div data-testid="hr-select" data-value={value} data-disabled={String(!!disabled)}>{children}</div>
      </Ctx.Provider>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ value, children }: any) => {
      const c: any = React.useContext(Ctx)
      return <button onClick={() => c.onValueChange(value)}>{children}</button>
    },
  }
})

const mitglieder: any[] = [
  { ID: 1, Vorname: 'VAnna', Nachname: 'N1', Spitzname: 'S1', Anzeigename: 'Anna' },
  { ID: 2, Vorname: 'VBert', Nachname: 'N2', Spitzname: 'S2', Anzeigename: 'Bert' },
  { ID: 3, Vorname: 'VCora', Nachname: 'N3', Spitzname: 'S3', Anzeigename: 'Cora' },
]
const date = new Date(Date.UTC(2024, 2, 1))

function setup(spiel: string, over: any = {}) {
  const props = { mitglieder, spiel, date, meisterschaftsId: 5, onSaveSuccess: jest.fn(), ...over }
  const utils = render(<ErgebniseingabeCard {...props} />)
  return { ...utils, props }
}
const add = (name: string) => {
  const row = screen.getAllByText(name).map(e => e.closest('tr')!).find(r => within(r).queryByTitle('Zur Eingabetabelle hinzufügen'))!
  fireEvent.click(within(row).getByTitle('Zur Eingabetabelle hinzufügen'))
}
const inputs = () => screen.queryAllByRole('spinbutton') as HTMLInputElement[]
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
const trash = () => screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-trash-2'))

function dt(data: Record<string, string> = {}) {
  const store = { ...data }
  return { getData: (k: string) => store[k] || '', setData: jest.fn((k: string, v: string) => { store[k] = v }), effectAllowed: '', dropEffect: '' }
}

describe('ErgebniseingabeCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(saveEingabeAction as jest.Mock).mockResolvedValue({ success: true })
    ;(deleteEingabeRowAction as jest.Mock).mockResolvedValue({ success: true })
  })
  afterEach(() => {
    ;(console.log as jest.Mock).mockRestore()
    ;(console.error as jest.Mock).mockRestore()
  })

  describe('general', () => {
    it('shows game name, member list and no save button without data', () => {
      setup('pokal')
      expect(screen.getByText('Ergebniseingabe')).toBeInTheDocument()
      expect(screen.getByText('Pokal', { selector: 'span' })).toBeInTheDocument()
      expect(screen.getByText('Anna')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Speichern' })).not.toBeInTheDocument()
    })

    it('shows no members without meisterschaftsId', () => {
      setup('pokal', { meisterschaftsId: undefined })
      expect(screen.queryByText('Anna')).not.toBeInTheDocument()
    })

    it('shows a hint for an unknown game and the raw id as name', () => {
      setup('unbekannt')
      expect(screen.getByText('Bitte ein Spiel auswählen')).toBeInTheDocument()
      expect(screen.getByText('unbekannt')).toBeInTheDocument()
    })

    it('disables add and delete buttons when disabled', () => {
      setup('pokal', { disabled: true })
      screen.getAllByTitle('Zur Eingabetabelle hinzufügen').forEach(b => expect(b).toBeDisabled())
    })

    it('renders correct game names', () => {
      const { rerender, props } = setup('9er-ratten-kranz8')
      expect(screen.getByText('9er, Ratten & Kranz 8')).toBeInTheDocument()
      rerender(<ErgebniseingabeCard {...props} spiel="6-tage-rennen" />)
      expect(screen.getByText('6-Tage-Rennen')).toBeInTheDocument()
      rerender(<ErgebniseingabeCard {...props} spiel="sargkegeln" />)
      expect(screen.getByText('Sargkegeln', { selector: 'span' })).toBeInTheDocument()
      rerender(<ErgebniseingabeCard {...props} spiel="kombimeisterschaft" />)
      expect(screen.getByText('Kombimeisterschaft')).toBeInTheDocument()
      rerender(<ErgebniseingabeCard {...props} spiel="blitztunier" />)
      expect(screen.getByText('Blitztunier')).toBeInTheDocument()
      rerender(<ErgebniseingabeCard {...props} spiel="meisterschaft" />)
      expect(screen.getByText('Meisterschaft', { selector: 'span' })).toBeInTheDocument()
    })
  })

  describe('9er / Ratten / Kranz 8', () => {
    it('adds a player once, edits values and saves payload', async () => {
      const { props } = setup('9er-ratten-kranz8')
      add('Anna')
      add('Anna') // duplicate ignored
      expect(inputs()).toHaveLength(3)
      const [neuner, kranz, ratten] = inputs()
      fireEvent.change(neuner, { target: { value: '7' } })
      fireEvent.change(kranz, { target: { value: '2' } })
      fireEvent.change(ratten, { target: { value: '1' } })
      expect(inputs().map(i => i.value)).toEqual(['7', '2', '1'])
      save()
      await waitFor(() => expect(saveEingabeAction).toHaveBeenCalled())
      expect(saveEingabeAction).toHaveBeenCalledWith(5, date, '9er-ratten-kranz8',
        [{ ID: undefined, SpielerID: 1, Neuner: 7, Ratten: 1, Kranz8: 2 }], [])
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Erfolgreich gespeichert!'))
      expect(props.onSaveSuccess).toHaveBeenCalled()
    })

    it('treats non-numeric input as 0 (keyboard input)', () => {
      setup('9er-ratten-kranz8')
      add('Anna')
      fireEvent.change(inputs()[0], { target: { value: '5' } })
      fireEvent.change(inputs()[0], { target: { value: '' } })
      expect(inputs()[0].value).toBe('0')
    })

    it('blurs number input on wheel to avoid accidental changes', () => {
      setup('9er-ratten-kranz8')
      add('Anna')
      const i = inputs()[0]
      i.focus()
      fireEvent.wheel(i)
      expect(document.activeElement).not.toBe(i)
    })

    it('removes unsaved row locally without calling delete action', async () => {
      setup('9er-ratten-kranz8')
      add('Anna')
      fireEvent.click(trash()[0])
      await waitFor(() => expect(inputs()).toHaveLength(0))
      expect(deleteEingabeRowAction).not.toHaveBeenCalled()
    })
  })

  describe('6-Tage-Rennen', () => {
    it('pairs two players, rejects self-pairing and saves with Spielnr', async () => {
      setup('6-tage-rennen')
      add('Anna')
      expect(screen.getByText('...')).toBeInTheDocument()
      add('Anna') // self not allowed
      expect(screen.getByText('...')).toBeInTheDocument()
      add('Bert')
      expect(screen.queryByText('...')).not.toBeInTheDocument()
      const [runden, punkte, nr] = inputs()
      expect(nr.value).toBe('1')
      fireEvent.change(runden, { target: { value: '12' } })
      fireEvent.change(punkte, { target: { value: '30' } })
      fireEvent.change(nr, { target: { value: '3' } })
      save()
      await waitFor(() => expect(saveEingabeAction).toHaveBeenCalled())
      expect(saveEingabeAction).toHaveBeenCalledWith(5, date, '6-tage-rennen',
        [{ ID: undefined, Spieler1ID: 1, Spieler2ID: 2, Runden: 12, Punkte: 30, Spielnr: 3 }], [])
    })

    it('starts a new pair after a complete one', () => {
      setup('6-tage-rennen')
      add('Anna'); add('Bert'); add('Anna')
      expect(inputs()).toHaveLength(6)
    })

    it('loads initial data and deletes persisted row via action', async () => {
      const { props } = setup('6-tage-rennen', {
        initialData: { sechsTageRennen: [{ ID: 11, Spieltag: 'x', SpieltagID: 1, Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', Runden: 4, Punkte: 9, Spielnr: 2 }] },
      })
      expect(inputs().map(i => i.value)).toEqual(['4', '9', '2'])
      fireEvent.click(trash()[0])
      await waitFor(() => expect(deleteEingabeRowAction).toHaveBeenCalledWith(11, '6-tage-rennen'))
      expect(toast.success).toHaveBeenCalledWith('Eintrag gelöscht')
      expect(props.onSaveSuccess).toHaveBeenCalled()
      await waitFor(() => expect(inputs()).toHaveLength(0))
    })
  })

  describe('Pokal / Sargkegeln', () => {
    it.each(['pokal', 'sargkegeln'])('%s: assigns increasing Platzierung and saves', async (spiel) => {
      setup(spiel)
      add('Anna'); add('Bert'); add('Anna')
      expect(inputs().map(i => i.value)).toEqual(['1', '2'])
      fireEvent.change(inputs()[1], { target: { value: '5' } })
      save()
      await waitFor(() => expect(saveEingabeAction).toHaveBeenCalled())
      expect(saveEingabeAction).toHaveBeenCalledWith(5, date, spiel,
        [{ ID: undefined, SpielerID: 1, Platzierung: 1 }, { ID: undefined, SpielerID: 2, Platzierung: 5 }], [])
    })

    it('pokal: failed delete keeps row and toasts error', async () => {
      ;(deleteEingabeRowAction as jest.Mock).mockResolvedValue({ success: false })
      const { props } = setup('pokal', { initialData: { pokal: [{ ID: 8, Spieltag: 'x', SpieltagID: 1, SpielerID: 1, Spielername: 'Anna', Platzierung: 2 }] } })
      fireEvent.click(trash()[0])
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Löschen'))
      expect(inputs()).toHaveLength(1)
      expect(props.onSaveSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Meisterschaft / Blitztunier', () => {
    it.each([['meisterschaft', 'Holz'], ['blitztunier', 'Pkt']])('%s: pairs, labels with %s and saves incl. Hin/Rück', async (spiel, label) => {
      setup(spiel)
      add('Anna'); add('Bert')
      expect(screen.getByText(`${label} S1`)).toBeInTheDocument()
      fireEvent.change(inputs()[0], { target: { value: '120' } })
      fireEvent.change(inputs()[1], { target: { value: '110' } })
      expect(screen.getByTestId('hr-select')).toHaveAttribute('data-value', 'Hinrunde')
      fireEvent.click(screen.getByText('Rückrunde'))
      expect(screen.getByTestId('hr-select')).toHaveAttribute('data-value', 'Rückrunde')
      save()
      await waitFor(() => expect(saveEingabeAction).toHaveBeenCalled())
      expect(saveEingabeAction).toHaveBeenCalledWith(5, date, spiel,
        [{ ID: undefined, Spieler1ID: 1, Spieler2ID: 2, Wert1: 120, Wert2: 110, HinRueckrunde: 'Rückrunde' }], [])
    })

    it.each(['meisterschaft', 'blitztunier'])('%s: same player may play several games; self-pair rejected', (spiel) => {
      setup(spiel)
      add('Anna'); add('Anna')
      expect(screen.getByText('...')).toBeInTheDocument()
      add('Bert'); add('Anna'); add('Bert')
      expect(screen.queryByText('...')).not.toBeInTheDocument()
      expect(screen.getAllByTestId('hr-select')).toHaveLength(2)
    })

    it('meisterschaft: loads Wert from HolzSpieler and deletes the correct row', async () => {
      setup('meisterschaft', {
        initialData: {
          meisterschaft: [
            { ID: 1, Spieltag: 'x', SpieltagID: 1, Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 'Hinrunde' },
            { ID: 2, Spieltag: 'x', SpieltagID: 1, Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', HolzSpieler1: 50, HolzSpieler2: 40, HinRueckrunde: 'Rückrunde' },
          ],
        },
      })
      expect(inputs().map(i => i.value)).toEqual(['100', '90', '50', '40'])
      fireEvent.click(trash()[0])
      await waitFor(() => expect(inputs().map(i => i.value)).toEqual(['50', '40']))
      expect(deleteEingabeRowAction).toHaveBeenCalledWith(1, 'meisterschaft')
    })

    it('blitztunier: loads PunkteSpieler from initial data and can remove', async () => {
      setup('blitztunier', {
        initialData: { blitztunier: [{ ID: 4, Spieltag: 'x', SpieltagID: 1, Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', PunkteSpieler1: 3, PunkteSpieler2: 1, HinRueckrunde: 'Hinrunde' }] },
      })
      expect(inputs().map(i => i.value)).toEqual(['3', '1'])
      fireEvent.click(trash()[0])
      await waitFor(() => expect(inputs()).toHaveLength(0))
      expect(deleteEingabeRowAction).toHaveBeenCalledWith(4, 'blitztunier')
    })
  })

  describe('Kombimeisterschaft', () => {
    it('pairs players, edits four values and saves', async () => {
      setup('kombimeisterschaft')
      add('Anna'); add('Bert')
      expect(screen.getByText('S1 3-8')).toBeInTheDocument()
      const i = inputs()
      expect(i).toHaveLength(4)
      i.forEach((inp, idx) => fireEvent.change(inp, { target: { value: String(idx + 1) } }))
      fireEvent.click(screen.getByText('Rückrunde'))
      save()
      await waitFor(() => expect(saveEingabeAction).toHaveBeenCalled())
      expect(saveEingabeAction).toHaveBeenCalledWith(5, date, 'kombimeisterschaft',
        [{ ID: undefined, Spieler1ID: 1, Spieler2ID: 2, S1_3bis8: 1, S1_5K: 2, S2_3bis8: 3, S2_5K: 4, HinRueckrunde: 'Rückrunde' }], [])
    })

    it('loads initial data and removes a persisted row', async () => {
      setup('kombimeisterschaft', {
        initialData: { kombimeisterschaft: [{ ID: 6, Spieltag: 'x', SpieltagID: 1, Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', Spieler1Punkte3bis8: 10, Spieler1Punkte5Kugeln: 11, Spieler2Punkte3bis8: 12, Spieler2Punkte5Kugeln: 13, HinRueckrunde: 'Hinrunde' }] },
      })
      expect(inputs().map(i => i.value)).toEqual(['10', '11', '12', '13'])
      fireEvent.click(trash()[0])
      await waitFor(() => expect(deleteEingabeRowAction).toHaveBeenCalledWith(6, 'kombimeisterschaft'))
      await waitFor(() => expect(inputs()).toHaveLength(0))
    })
  })

  describe('saving', () => {
    it('warns when date is missing', async () => {
      setup('pokal', { date: undefined })
      add('Anna')
      save()
      await waitFor(() => expect(toast.warning).toHaveBeenCalledWith('Bitte Datum und aktive Meisterschaft auswählen.'))
      expect(saveEingabeAction).not.toHaveBeenCalled()
    })

    it('warns when there is no active Meisterschaft (data from initialData)', async () => {
      setup('pokal', { meisterschaftsId: undefined, initialData: { pokal: [{ ID: 8, Spieltag: 'x', SpieltagID: 1, SpielerID: 1, Spielername: 'Anna', Platzierung: 1 }] } })
      save()
      await waitFor(() => expect(toast.warning).toHaveBeenCalled())
      expect(saveEingabeAction).not.toHaveBeenCalled()
    })

    it('shows server error message', async () => {
      ;(saveEingabeAction as jest.Mock).mockResolvedValue({ success: false, error: 'Doppelter Eintrag' })
      const { props } = setup('pokal')
      add('Anna')
      save()
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Doppelter Eintrag'))
      expect(props.onSaveSuccess).not.toHaveBeenCalled()
    })

    it('falls back to generic error message', async () => {
      ;(saveEingabeAction as jest.Mock).mockResolvedValue({ success: false })
      setup('pokal')
      add('Anna')
      save()
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Speichern'))
    })

    it('handles thrown exceptions', async () => {
      ;(saveEingabeAction as jest.Mock).mockRejectedValue(new Error('Netzwerk'))
      setup('pokal')
      add('Anna')
      save()
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Netzwerk'))
    })

    it('works without onSaveSuccess callback', async () => {
      setup('pokal', { onSaveSuccess: undefined })
      add('Anna')
      save()
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Erfolgreich gespeichert!'))
    })

    it('includes IDs of persisted rows in payload', async () => {
      setup('pokal', { initialData: { pokal: [{ ID: 8, Spieltag: 'x', SpieltagID: 1, SpielerID: 1, Spielername: 'Anna', Platzierung: 3 }] } })
      save()
      await waitFor(() => expect(saveEingabeAction).toHaveBeenCalledWith(5, date, 'pokal', [{ ID: 8, SpielerID: 1, Platzierung: 3 }], []))
    })

    it('clears the tables when initialData becomes null', async () => {
      const { rerender, props } = setup('pokal', { initialData: { pokal: [{ ID: 8, Spieltag: 'x', SpieltagID: 1, SpielerID: 1, Spielername: 'Anna', Platzierung: 3 }] } })
      expect(inputs()).toHaveLength(1)
      rerender(<ErgebniseingabeCard {...props} initialData={null} />)
      await waitFor(() => expect(inputs()).toHaveLength(0))
    })
  })

  describe('drag and drop', () => {
    const eingabe = () => screen.getByText('Eingabetabelle').parentElement as HTMLElement
    const members = () => screen.getByText('Aktive Mitglieder').parentElement as HTMLElement

    it('sets drag data when dragging a member and adds it when dropped on the input table', () => {
      setup('pokal')
      const row = screen.getByText('Anna').closest('tr')!
      const d = dt()
      fireEvent.dragStart(row, { dataTransfer: d })
      expect(d.setData).toHaveBeenCalledWith('mitglied', JSON.stringify(mitglieder[0]))
      fireEvent.dragOver(eingabe(), { dataTransfer: d })
      fireEvent.drop(eingabe(), { dataTransfer: dt({ mitglied: JSON.stringify(mitglieder[1]) }) })
      expect(inputs()).toHaveLength(1)
      expect(screen.getAllByText('Bert').length).toBeGreaterThan(1)
    })

    it('ignores drops without data', () => {
      setup('pokal')
      fireEvent.drop(eingabe(), { dataTransfer: dt() })
      fireEvent.drop(members(), { dataTransfer: dt() })
      expect(inputs()).toHaveLength(0)
    })

    it('dropping an existing persisted item on the members list deletes it', async () => {
      const item = { ID: 8, SpielerID: 1, Spielername: 'Anna', Platzierung: 3 }
      const { props } = setup('pokal', { initialData: { pokal: [{ ...item, Spieltag: 'x', SpieltagID: 1 }] } })
      const d = dt()
      fireEvent.dragStart(inputs()[0].closest('tr')!, { dataTransfer: d })
      expect(d.setData).toHaveBeenCalledWith('sourceTable', 'pokal')
      fireEvent.drop(members(), { dataTransfer: dt({ existingItem: JSON.stringify(item), sourceTable: 'pokal' }) })
      await waitFor(() => expect(deleteEingabeRowAction).toHaveBeenCalledWith(8, 'pokal'))
      await waitFor(() => expect(inputs()).toHaveLength(0))
      expect(props.onSaveSuccess).toHaveBeenCalled()
    })

    it('drop on members keeps item when delete fails', async () => {
      ;(deleteEingabeRowAction as jest.Mock).mockResolvedValue({ success: false })
      const item = { ID: 8, SpielerID: 1, Spielername: 'Anna', Platzierung: 3 }
      setup('pokal', { initialData: { pokal: [{ ...item, Spieltag: 'x', SpieltagID: 1 }] } })
      fireEvent.drop(members(), { dataTransfer: dt({ existingItem: JSON.stringify(item), sourceTable: 'pokal' }) })
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Fehler beim Löschen'))
      expect(inputs()).toHaveLength(1)
    })

    it.each([
      ['9er-ratten-kranz8', { SpielerID: 1, Spielername: 'Anna', Neuner: 1, Kranz8: 0, Ratten: 0 }],
      ['sargkegeln', { SpielerID: 1, Spielername: 'Anna', Platzierung: 1 }],
      ['6-tage-rennen', { Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', Runden: 1, Punkte: 1, Spielnr: 1 }],
      ['meisterschaft', { Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', Wert1: 1, Wert2: 1, HinRueckrunde: 'Hinrunde' }],
      ['blitztunier', { Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', Wert1: 1, Wert2: 1, HinRueckrunde: 'Hinrunde' }],
      ['kombimeisterschaft', { Spieler1ID: 1, Spieler1Name: 'Anna', Spieler2ID: 2, Spieler2Name: 'Bert', S1_3bis8: 1, S1_5K: 1, S2_3bis8: 1, S2_5K: 1, HinRueckrunde: 'Hinrunde' }],
    ])('%s: dropping an unsaved row on members removes it locally', async (spiel, item) => {
      setup(spiel)
      add('Anna')
      if ('Spieler1ID' in item) add('Bert')
      expect(inputs().length).toBeGreaterThan(0)
      fireEvent.drop(members(), { dataTransfer: dt({ existingItem: JSON.stringify(item), sourceTable: spiel }) })
      await waitFor(() => expect(inputs()).toHaveLength(0))
      expect(deleteEingabeRowAction).not.toHaveBeenCalled()
    })

    it('dropping an unknown row on a pair table leaves the table untouched', async () => {
      setup('meisterschaft')
      add('Anna'); add('Bert')
      const item = { Spieler1ID: 9, Spieler1Name: 'X', Spieler2ID: 8, Spieler2Name: 'Y', Wert1: 0, Wert2: 0, HinRueckrunde: 'Hinrunde' }
      fireEvent.drop(members(), { dataTransfer: dt({ existingItem: JSON.stringify(item), sourceTable: 'meisterschaft' }) })
      await waitFor(() => expect(inputs()).toHaveLength(2))
    })
  })
})
