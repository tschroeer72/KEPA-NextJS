import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import BenutzerzugriffPage from '../page'
import { useAuthContext } from '@/providers/auth-context-provider'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

jest.mock('@/providers/auth-context-provider', () => ({
  useAuthContext: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('axios')
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock lucide icons to avoid rendering issues
jest.mock('lucide-react', () => ({
  Save: () => <div data-testid="save-icon">Save</div>,
  UserMinus: () => <div data-testid="minus-icon">Minus</div>,
  UserCheck: () => <div data-testid="check-icon">Check</div>,
  Loader2: () => <div data-testid="loader-icon">Loader</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
}))

// Mock UI components
jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableCell: ({ children }: any) => <td>{children}</td>,
}))

jest.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: any) => <div>{children}</div>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children }: any) => <button>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}))

describe('BenutzerzugriffPage', () => {
  const push = jest.fn()
  const mockMitglieder = [
    { ID: 1, Vorname: 'Max', Nachname: 'Mustermann', Login: 'max', Password: 'pwd' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push })
    ;(useAuthContext as jest.Mock).mockReturnValue({
      isLogin: true,
      isAdmin: true,
    })
    ;(axios.get as jest.Mock).mockResolvedValue({ data: mockMitglieder })
  })

  it('renders and fetches mitglieder', async () => {
    await act(async () => {
      render(<BenutzerzugriffPage />)
    })
    expect(screen.getAllByText(/Benutzerzugriff/i).length).toBeGreaterThan(0)
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/verwaltung/benutzerzugriff')
    })
    expect((await screen.findAllByText(/Max/i)).length).toBeGreaterThan(0)
    expect((await screen.findAllByText(/Mustermann/i)).length).toBeGreaterThan(0)
  })

  it('redirects if not admin', async () => {
    ;(useAuthContext as jest.Mock).mockReturnValue({
      isLogin: true,
      isAdmin: false,
    })
    await act(async () => {
      render(<BenutzerzugriffPage />)
    })
    expect(push).toHaveBeenCalledWith('/verwaltung')
  })

  it('handles edit and save', async () => {
    await act(async () => {
      render(<BenutzerzugriffPage />)
    })
    
    // Wait for data to load
    await screen.findAllByText(/Max/i)
    
    // Click "Editieren" button
    const editButton = await screen.findByRole('button', { name: /Editieren/i })
    await act(async () => {
      fireEvent.click(editButton)
    })
    
    const loginInput = await screen.findByDisplayValue('max')
    await act(async () => {
      fireEvent.change(loginInput, { target: { value: 'max_new' } })
    })
    
    ;(axios.post as jest.Mock).mockResolvedValue({ status: 200 })
    
    // When editing, the "Speichern" button should appear
    const saveButton = await screen.findByRole('button', { name: /Speichern/i })
    await act(async () => {
      fireEvent.click(saveButton)
    })
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/verwaltung/benutzerzugriff', expect.objectContaining({
        id: 1,
        login: 'max_new',
        action: 'speichern'
      }))
    })
    expect(toast.success).toHaveBeenCalled()
  })
})
