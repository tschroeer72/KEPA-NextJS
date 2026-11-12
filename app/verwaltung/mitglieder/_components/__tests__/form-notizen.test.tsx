import { render, screen, fireEvent } from '@testing-library/react'
import FormNotizen from '../form-notizen'

describe('FormNotizen', () => {
  it('renders values and reports changes', () => {
    const onChange = jest.fn()
    render(<FormNotizen formData={{ Notizen: 'N', Bemerkungen: 'B' } as any} onFormDataChange={onChange} isEditable />)
    expect(screen.getByLabelText('Notizen')).toHaveValue('N')
    expect(screen.getByLabelText('Bemerkungen')).toHaveValue('B')
    fireEvent.change(screen.getByLabelText('Notizen'), { target: { value: 'neu' } })
    expect(onChange).toHaveBeenCalledWith('Notizen', 'neu')
    fireEvent.change(screen.getByLabelText('Bemerkungen'), { target: { value: 'x' } })
    expect(onChange).toHaveBeenCalledWith('Bemerkungen', 'x')
  })

  it('disables fields when not editable and handles empty values', () => {
    render(<FormNotizen formData={{} as any} onFormDataChange={jest.fn()} isEditable={false} />)
    expect(screen.getByLabelText('Notizen')).toBeDisabled()
    expect(screen.getByLabelText('Notizen')).toHaveValue('')
    expect(screen.getByLabelText('Bemerkungen')).toBeDisabled()
  })
})
