import { describe, expect, it } from 'vitest'
import { getSafeNextPath } from './navigation'

describe('getSafeNextPath', () => {
  it('allows an internal invitation path', () => {
    expect(getSafeNextPath('/invite/abc_123', 'https://inventory.example')).toBe('/invite/abc_123')
  })

  it('rejects external and protocol-relative redirects', () => {
    expect(getSafeNextPath('https://evil.example', 'https://inventory.example')).toBeNull()
    expect(getSafeNextPath('//evil.example/path', 'https://inventory.example')).toBeNull()
    expect(getSafeNextPath('/\\evil.example/path', 'https://inventory.example')).toBeNull()
  })
})
