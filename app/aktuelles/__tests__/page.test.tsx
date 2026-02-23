import { render, screen } from '@testing-library/react'
import Aktuelles from '../page'

describe('Aktuelles Page', () => {
  it('renders the heading and content', () => {
    render(<Aktuelles />)
    expect(screen.getByRole('heading', { name: /Aktuelles/i })).toBeInTheDocument()
    expect(screen.getByText(/Bist Du zwischen 50 und 70 Jahre jung/i)).toBeInTheDocument()
    expect(screen.getByText(/Wir treffen uns alle 14 Tage/i)).toBeInTheDocument()
  })
})
