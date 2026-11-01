export const SIZE_GROUPS = [
  { id: 'sneakers', label: 'کتونی', sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'] },
  { id: 'pants', label: 'شلوار', sizes: ['24', '25', '26', '27', '28', '30', '32', '34', '36', '38', '40'] },
  { id: 'clothing', label: 'لباس', sizes: ['S', 'M', 'X', 'XL', 'XXL'] },
] as const

export type SizeGroupId = typeof SIZE_GROUPS[number]['id']
