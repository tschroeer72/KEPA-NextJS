import { render, screen, fireEvent } from '@testing-library/react'
import MitgliederClient from '../mitglieder-client'

jest.mock('../treeview', () => ({
  __esModule: true,
  default: ({ onMemberSelect, lstMitglieder }: any) => (
    <button onClick={() => onMemberSelect(7)}>tree {lstMitglieder.length}</button>
  ),
}))
jest.mock('../mitglied-daten', () => ({
  __esModule: true,
  default: ({ MitgliedID, onDataChange }: any) => (
    <div>
      <span data-testid="id">{MitgliedID}</span>
      <button onClick={onDataChange}>changed</button>
    </div>
  ),
}))

describe('MitgliederClient', () => {
  it('passes selected id to MitgliedDaten and forwards data change', () => {
    const onDataChange = jest.fn()
    render(<MitgliederClient lstMitglieder={[]} onDataChange={onDataChange} />)
    expect(screen.getByTestId('id')).toHaveTextContent('-1')
    fireEvent.click(screen.getByText('tree 0'))
    expect(screen.getByTestId('id')).toHaveTextContent('7')
    fireEvent.click(screen.getByText('changed'))
    expect(onDataChange).toHaveBeenCalledTimes(1)
  })
})
