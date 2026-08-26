export function getSafeNextPath(value: string | null, origin = window.location.origin) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null
  try {
    const target = new URL(value, origin)
    if (target.origin !== origin) return null
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return null
  }
}
