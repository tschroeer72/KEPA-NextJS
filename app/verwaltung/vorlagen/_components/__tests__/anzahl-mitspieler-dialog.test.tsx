import { render, screen, fireEvent } from '@testing-library/react'
import { AnzahlMitspielerDialog } from '../anzahl-mitspieler-dialog'

function setup(open = true) {
  const onOpenChange = jest.fn()
  const onConfirm = jest.fn()
  render(<AnzahlMitspielerDialog open={open} onOpenChange={onOpenChange} onConfirm={onConfirm} titel="Titel X" />)
  return { onOpenChange, onConfirm }
}

describe('AnzahlMitspielerDialog', () => {
  it('renders nothing when closed', () => {
    setup(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders title, default value 3 and hint', () => {
    setup()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Titel X')).toBeInTheDocument()
    expect(screen.getByLabelText('Teilnehmer')).toHaveValue(3)
    expect(screen.getByText('Die Anzahl der Teilnehmer muss mindestens 3 sein.')).toBeInTheDocument()
  })

  it('confirms with the entered number and closes', () => {
    const { onConfirm, onOpenChange } = setup()
    fireEvent.change(screen.getByLabelText('Teilnehmer'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'PDF Generieren' }))
    expect(onConfirm).toHaveBeenCalledWith(12)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('does not confirm values below 3', () => {
    const { onConfirm, onOpenChange } = setup()
    fireEvent.change(screen.getByLabelText('Teilnehmer'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'PDF Generieren' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('does not confirm an empty value', () => {
    const { onConfirm } = setup()
    fireEvent.change(screen.getByLabelText('Teilnehmer'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'PDF Generieren' }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirms the default of 3', () => {
    const { onConfirm } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'PDF Generieren' }))
    expect(onConfirm).toHaveBeenCalledWith(3)
  })
})
