const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه', 'ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده']
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد']
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون']

function join(parts: string[]) {
  return parts.filter(Boolean).join(' و ')
}

function underThousand(value: number) {
  const hundreds = Math.floor(value / 100)
  const remainder = value % 100
  const parts = hundreds ? [HUNDREDS[hundreds]] : []

  if (remainder < 20) {
    if (remainder) parts.push(ONES[remainder])
  } else {
    parts.push(TENS[Math.floor(remainder / 10)])
    if (remainder % 10) parts.push(ONES[remainder % 10])
  }

  return join(parts)
}

function normalizeInteger(value: string | number) {
  const normalized = String(value)
    .trim()
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[,٬\s]/g, '')

  if (!/^-?\d+$/.test(normalized)) return null
  const amount = Number(normalized)
  return Number.isSafeInteger(amount) ? amount : null
}

export function formatTomanInWords(value: string | number) {
  if (String(value).trim() === '') return null
  const amount = normalizeInteger(value)
  if (amount === null) return null
  if (amount === 0) return 'صفر تومان'

  let remaining = Math.abs(amount)
  const groups: string[] = []
  let scaleIndex = 0

  while (remaining > 0) {
    const group = remaining % 1000
    if (group) {
      const words = underThousand(group)
      groups.unshift(SCALES[scaleIndex] ? `${words} ${SCALES[scaleIndex]}` : words)
    }
    remaining = Math.floor(remaining / 1000)
    scaleIndex += 1
  }

  const words = join(groups)
  return `${amount < 0 ? `منفی ${words}` : words} تومان`
}
