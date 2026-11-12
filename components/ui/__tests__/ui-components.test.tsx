import { render, screen, fireEvent } from '@testing-library/react'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '../alert-dialog'
import { Calendar } from '../calendar'
import { RadioGroup, RadioGroupItem } from '../radio-group'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator,
} from '../select'
import { Skeleton } from '../skeleton'
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose,
} from '../dialog'
import { Toaster } from '../sonner'
import {
  Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverHeader, PopoverTitle, PopoverDescription,
} from '../popover'
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut,
} from '../command'

jest.mock('next-themes', () => ({ useTheme: () => ({ theme: 'dark' }) }))

describe('AlertDialog', () => {
  it('opens, and runs action / cancel handlers', () => {
    const onAction = jest.fn()
    const onCancel = jest.fn()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Titel</AlertDialogTitle>
            <AlertDialogDescription>Beschreibung</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Nein</AlertDialogCancel>
            <AlertDialogAction onClick={onAction}>Ja</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Beschreibung')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Ja'))
    expect(onAction).toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open'))
    fireEvent.click(screen.getByText('Nein'))
    expect(onCancel).toHaveBeenCalled()
  })
})

describe('Dialog', () => {
  it('opens via trigger, shows content and closes via close button', () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Titel</DialogTitle>
            <DialogDescription>Beschreibung</DialogDescription>
          </DialogHeader>
          <DialogFooter><DialogClose>Schließen</DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>
    )
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Titel')).toBeInTheDocument()
    fireEvent.click(screen.getAllByText('Schließen')[0])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('can hide the built-in close button', () => {
    render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('RadioGroup', () => {
  it('selects an item and reports the value', () => {
    const onChange = jest.fn()
    render(
      <RadioGroup defaultValue="a" onValueChange={onChange}>
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>
    )
    expect(screen.getByLabelText('A')).toBeChecked()
    fireEvent.click(screen.getByLabelText('B'))
    expect(onChange).toHaveBeenCalledWith('b')
    expect(screen.getByLabelText('B')).toBeChecked()
  })
})

describe('Select', () => {
  it('shows placeholder, opens and selects an item', () => {
    const onChange = jest.fn()
    render(
      <Select onValueChange={onChange}>
        <SelectTrigger size="sm"><SelectValue placeholder="Bitte wählen" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Gruppe</SelectLabel>
            <SelectItem value="x">Eins</SelectItem>
            <SelectSeparator />
            <SelectItem value="y">Zwei</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText('Bitte wählen')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('combobox'))
    expect(screen.getByText('Gruppe')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: 'Zwei' }))
    expect(onChange).toHaveBeenCalledWith('y')
    expect(screen.getByRole('combobox')).toHaveTextContent('Zwei')
  })
})

describe('Skeleton', () => {
  it('renders with custom class', () => {
    const { container } = render(<Skeleton className="h-4 w-4" />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveAttribute('data-slot', 'skeleton')
    expect(el).toHaveClass('animate-pulse', 'h-4')
  })
})

describe('Popover', () => {
  it('toggles content via trigger', () => {
    render(
      <Popover>
        <PopoverTrigger>Toggle</PopoverTrigger>
        <PopoverContent>Popover-Inhalt</PopoverContent>
      </Popover>
    )
    expect(screen.queryByText('Popover-Inhalt')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Toggle'))
    expect(screen.getByText('Popover-Inhalt')).toBeInTheDocument()
  })

  it('renders anchor, header, title and description parts', () => {
    render(
      <Popover open>
        <PopoverAnchor data-testid="anchor" />
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Titel</PopoverTitle>
            <PopoverDescription>Beschreibung</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    )
    expect(screen.getByTestId('anchor')).toHaveAttribute('data-slot', 'popover-anchor')
    expect(screen.getByText('Titel')).toHaveAttribute('data-slot', 'popover-title')
    expect(screen.getByText('Beschreibung')).toHaveAttribute('data-slot', 'popover-description')
  })
})

describe('Toaster (sonner)', () => {
  it('renders the sonner container using the current theme', () => {
    const { container } = render(<Toaster />)
    expect(container.ownerDocument.querySelector('.toaster, section[aria-label]')).toBeTruthy()
  })
})

describe('Calendar', () => {
  it('renders a month grid and reports a selected day', () => {
    const onSelect = jest.fn()
    render(<Calendar mode="single" defaultMonth={new Date(2024, 4, 1)} onSelect={onSelect} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /15/ }))
    expect(onSelect).toHaveBeenCalled()
    expect((onSelect.mock.calls[0][0] as Date).getDate()).toBe(15)
  })

  it('shows the selected day as selected', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2024, 4, 1)} selected={new Date(2024, 4, 10)} />)
    expect(screen.getByRole('button', { name: /10/ })).toHaveAttribute('data-selected-single', 'true')
  })

  it('navigates to the next month', () => {
    render(<Calendar mode="single" defaultMonth={new Date(2024, 4, 1)} />)
    expect(screen.getByText(/May 2024|Mai 2024/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next month|nächsten/i }))
    expect(screen.getByText(/June 2024|Juni 2024/)).toBeInTheDocument()
  })

  it('supports the dropdown caption layout and the range mode', () => {
    render(<Calendar mode="range" captionLayout="dropdown" defaultMonth={new Date(2024, 4, 1)} />)
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0)
  })
})

describe('Command', () => {
  it('filters items by search input and shows empty state', () => {
    render(
      <Command>
        <CommandInput placeholder="Suche..." />
        <CommandList>
          <CommandEmpty>Nichts gefunden</CommandEmpty>
          <CommandGroup heading="Gruppe">
            <CommandItem>Apfel<CommandShortcut>⌘A</CommandShortcut></CommandItem>
            <CommandSeparator />
            <CommandItem>Birne</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    expect(screen.getByText('Apfel')).toBeInTheDocument()
    expect(screen.getByText('Birne')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Suche...'), { target: { value: 'bir' } })
    expect(screen.queryByText('Apfel')).not.toBeInTheDocument()
    expect(screen.getByText('Birne')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Suche...'), { target: { value: 'zzz' } })
    expect(screen.getByText('Nichts gefunden')).toBeInTheDocument()
  })

  it('calls onSelect when an item is clicked', () => {
    const onSelect = jest.fn()
    render(
      <Command>
        <CommandList>
          <CommandItem onSelect={onSelect}>Klick</CommandItem>
        </CommandList>
      </Command>
    )
    fireEvent.click(screen.getByText('Klick'))
    expect(onSelect).toHaveBeenCalled()
  })
})
