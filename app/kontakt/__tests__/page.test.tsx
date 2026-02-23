import { render, screen, fireEvent } from '@testing-library/react'
import Kontakt from '../page'

describe('Kontakt Page', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders the contact form', () => {
    render(<Kontakt />)
    expect(screen.getByRole('heading', { name: /Kontakt/i })).toBeInTheDocument()
    expect(screen.getByText(/Name \*/i)).toBeInTheDocument()
    expect(screen.getByText(/Nachricht \*/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nachricht senden/i })).toBeInTheDocument()
  })

  it('shows error messages when required fields are empty', async () => {
    const { container } = render(<Kontakt />)
    const form = container.querySelector('form') as HTMLFormElement
    // Um HTML5-Validierung zu umgehen, damit onSubmit in Tests immer ausgelöst wird
    form.setAttribute('novalidate', 'true')

    fireEvent.submit(form)

    expect((await screen.findAllByText(/Name ist ein Pflichtfeld/i)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText(/Nachricht ist ein Pflichtfeld/i)).length).toBeGreaterThan(0)
  })

  it('opens mailto link when form is valid', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null as any)
    render(<Kontakt />)
    
    const nameInput = screen.getByLabelText(/Name \*/i)
    const messageInput = screen.getByLabelText(/Nachricht \*/i)

    fireEvent.change(nameInput, { target: { value: 'Test User', name: 'name' } })
    fireEvent.change(messageInput, { target: { value: 'Test Message', name: 'nachricht' } })
    
    const submitButton = screen.getByRole('button', { name: /Nachricht senden/i })
    fireEvent.click(submitButton)

    expect(openSpy).toHaveBeenCalled()
    expect((openSpy.mock.calls[0] as any)[0]).toContain('mailto:t.schroeer@web.de')
    expect((openSpy.mock.calls[0] as any)[1]).toBe('_self')
  })

  it('detects bot if honeypot field is filled', async () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null as any)
    const { container } = render(<Kontakt />)

    const honeypot = screen.getByLabelText(/Website/i)
    fireEvent.change(honeypot, { target: { value: 'bot.com', name: 'website' } })

    const nameInput = screen.getByLabelText(/Name \*/i)
    const messageInput = screen.getByLabelText(/Nachricht \*/i)

    fireEvent.change(nameInput, { target: { value: 'Bot', name: 'name' } })
    fireEvent.change(messageInput, { target: { value: 'Spam', name: 'nachricht' } })

    const form = container.querySelector('form') as HTMLFormElement
    form.setAttribute('novalidate', 'true')
    fireEvent.submit(form)

    expect((await screen.findAllByText(/Bot erkannt/i)).length).toBeGreaterThan(0)
    expect(openSpy).not.toHaveBeenCalled()
  })
})
