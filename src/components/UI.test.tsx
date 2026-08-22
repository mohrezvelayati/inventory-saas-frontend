import { fireEvent, render, screen } from '@testing-library/react'
import { SlidersHorizontal } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { FilterButton, Pagination } from './UI'

describe('FilterButton', () => {
  it('exposes its active state and click action', () => {
    const onClick = vi.fn()
    render(<FilterButton icon={SlidersHorizontal} active onClick={onClick}>فیلتر فعال</FilterButton>)
    const button = screen.getByRole('button', { name: /فیلتر فعال/ })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })
})

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
