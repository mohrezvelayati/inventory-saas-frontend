import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createImagePreviewUrl } from './image'

describe('createImagePreviewUrl', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn() })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  })

  it('returns browser-generated blob URLs', () => {
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:safe-preview')

    expect(createImagePreviewUrl(new File(['image'], 'shoe.png'))).toBe('blob:safe-preview')
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('rejects and revokes unexpected URL schemes', () => {
    vi.mocked(URL.createObjectURL).mockReturnValue('javascript:alert(1)')

    expect(createImagePreviewUrl(new File(['image'], 'shoe.png'))).toBe('')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('javascript:alert(1)')
  })
})
