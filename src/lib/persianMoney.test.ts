import { describe, expect, it } from 'vitest'
import { formatTomanInWords } from './persianMoney'

describe('formatTomanInWords', () => {
  it.each([
    ['', null],
    ['invalid', null],
    ['0', 'صفر تومان'],
    ['1000000', 'یک میلیون تومان'],
    ['5800000', 'پنج میلیون و هشتصد هزار تومان'],
    ['123456789', 'صد و بیست و سه میلیون و چهارصد و پنجاه و شش هزار و هفتصد و هشتاد و نه تومان'],
    ['۱٬۰۰۰٬۰۰۰', 'یک میلیون تومان'],
    ['-1000', 'منفی یک هزار تومان'],
  ])('formats %s', (value, expected) => {
    expect(formatTomanInWords(value)).toBe(expected)
  })
})
