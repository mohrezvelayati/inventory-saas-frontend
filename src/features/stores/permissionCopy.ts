import type { PermissionCode, StorePermission } from '../../types/api'

type PermissionCopy = {
  title: string
  description: string
}

const permissionCopy: Record<PermissionCode, PermissionCopy> = {
  create_sale: {
    title: 'ثبت فروش',
    description: 'ایجاد و تکمیل فروش جدید',
  },
  manage_catalog: {
    title: 'مدیریت محصولات',
    description: 'افزودن و ویرایش محصولات، سایزها و دسته‌بندی‌ها',
  },
  manage_customers: {
    title: 'مدیریت مشتریان',
    description: 'افزودن و ویرایش اطلاعات مشتریان',
  },
  manage_inventory: {
    title: 'مدیریت موجودی',
    description: 'ثبت ورود خرید و اصلاح موجودی',
  },
  manage_members: {
    title: 'مدیریت کاربران و نقش‌ها',
    description: 'مدیریت اعضای فروشگاه و دسترسی‌های آن‌ها',
  },
  manage_wanted: {
    title: 'مدیریت درخواست‌ها',
    description: 'ثبت و مدیریت درخواست کالاهای ناموجود',
  },
  view_dashboard: {
    title: 'مشاهده داشبورد',
    description: 'مشاهده خلاصه عملکرد روزانه فروشگاه',
  },
  view_inventory: {
    title: 'مشاهده موجودی',
    description: 'مشاهده تعداد و وضعیت موجودی کالاها',
  },
  view_sales: {
    title: 'مشاهده فروش‌ها',
    description: 'مشاهده فهرست و جزئیات فروش‌ها',
  },
}

export function getPermissionCopy(permission: StorePermission): PermissionCopy {
  return permissionCopy[permission.code] ?? {
    title: permission.name,
    description: 'دسترسی سفارشی فروشگاه',
  }
}
