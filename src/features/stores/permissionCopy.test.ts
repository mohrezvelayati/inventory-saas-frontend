import { describe, expect, it } from 'vitest'
import type { PermissionCode } from '../../types/api'
import { getPermissionCopy } from './permissionCopy'

const permissionCodes: PermissionCode[] = [
  'create_sale',
  'manage_catalog',
  'manage_customers',
  'manage_inventory',
  'manage_members',
  'manage_wanted',
  'view_dashboard',
  'view_inventory',
  'view_sales',
]

describe('permissionCopy', () => {
  it('provides Persian title and description for every permission', () => {
    for (const [index, code] of permissionCodes.entries()) {
      const copy = getPermissionCopy({ id: index + 1, code, name: 'English API name' })

      expect(copy.title).toMatch(/[\u0600-\u06ff]/)
      expect(copy.description).toMatch(/[\u0600-\u06ff]/)
      expect(copy.title).not.toContain('_')
      expect(copy.description).not.toContain('_')
    }
  })
})
