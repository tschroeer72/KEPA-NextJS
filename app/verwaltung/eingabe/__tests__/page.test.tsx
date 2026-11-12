import { render, screen } from '@testing-library/react'
import EingabePage from '../page'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tblMitglieder: { findMany: jest.fn() },
    tblMeisterschaften: { findFirst: jest.fn(), findMany: jest.fn() },
  },
}))

const mockContent = jest.fn()
jest.mock('../_components/eingabe-content', () => ({
  __esModule: true,
  default: (props: any) => {
    mockContent(props)
    return <div data-testid="eingabe-content" />
  },
}))

describe('EingabePage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('loads data and maps Anzeigename (Spitzname preferred)', async () => {
    ;(prisma.tblMeisterschaften.findFirst as jest.Mock).mockResolvedValue({ ID: 5, Bezeichnung: 'M', Aktiv: 1 })
    ;(prisma.tblMeisterschaften.findMany as jest.Mock).mockResolvedValue([{ ID: 5 }])
    ;(prisma.tblMitglieder.findMany as jest.Mock).mockResolvedValue([
      { ID: 1, Vorname: 'Hans', Nachname: 'A', Spitzname: 'Hansi' },
      { ID: 2, Vorname: 'Karl', Nachname: 'B', Spitzname: '  ' },
      { ID: 3, Vorname: 'Otto', Nachname: 'C', Spitzname: null },
    ])

    render(await EingabePage())

    expect(screen.getByTestId('eingabe-content')).toBeInTheDocument()
    const props = mockContent.mock.calls[0][0]
    expect(props.aktiveMeisterschaft.ID).toBe(5)
    expect(props.allMeisterschaften).toEqual([{ ID: 5 }])
    expect(props.mitglieder.map((m: any) => m.Anzeigename)).toEqual(['Hansi', 'Karl', 'Otto'])
    expect(props.mitglieder[2].Spitzname).toBe('')
    const arg = (prisma.tblMitglieder.findMany as jest.Mock).mock.calls[0][0]
    expect(arg.where).toEqual({ PassivSeit: null, tblTeilnehmer: { some: { MeisterschaftsID: 5 } } })
  })

  it('does not filter by Teilnehmer without active Meisterschaft', async () => {
    ;(prisma.tblMeisterschaften.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.tblMeisterschaften.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.tblMitglieder.findMany as jest.Mock).mockResolvedValue([])

    render(await EingabePage())

    const arg = (prisma.tblMitglieder.findMany as jest.Mock).mock.calls[0][0]
    expect(arg.where).toEqual({ PassivSeit: null })
    expect(mockContent.mock.calls[0][0].aktiveMeisterschaft).toBeNull()
  })
})
