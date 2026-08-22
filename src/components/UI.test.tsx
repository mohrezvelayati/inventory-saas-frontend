import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './UI'

describe('Pagination', () => {
  it('is hidden when all records fit on one page', () => {
    const { container } = render(<Pagination page={1} count={20} onChange={() => undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the current page and navigates in RTL order', () => {
    const onChange = vi.fn()
    render(<Pagination page={2} count={45} onChange={onChange} />)

    expect(screen.getByText('صفحه ۲ از ۳')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])

    expect(onChange).toHaveBeenNthCalledWith(1, 1)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('disables navigation at the page boundaries', () => {
    const { rerender } = render(<Pagination page={1} count={45} onChange={() => undefined} />)
    expect(screen.getAllByRole('button')[0]).toBeDisabled()

    rerender(<Pagination page={3} count={45} onChange={() => undefined} />)
    expect(screen.getAllByRole('button')[1]).toBeDisabled()
  })
})
