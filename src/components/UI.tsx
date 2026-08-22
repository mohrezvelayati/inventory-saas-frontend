import type { LucideIcon } from 'lucide-react'
import { ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { ReactNode } from 'react'

export function SearchBox({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="search-box">
      <Search size={22} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function FilterButton({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <button className="filter-button">
      <Icon size={19} />
      <span>{children}</span>
      <ChevronDown size={15} />
    </button>
  )
}

export function StatusBadge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>
}

export function EmptyState({ search }: { search: string }) {
  return (
    <div className="empty-state">
      <Search size={30} />
      <strong>نتیجه‌ای پیدا نشد</strong>
      <span>برای «{search}» موردی وجود ندارد.</span>
    </div>
  )
}

export function Pagination({ page, count, onChange, pageSize = 20 }: { page: number; count: number; onChange: (page: number) => void; pageSize?: number }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (pages <= 1) return null
  return <nav className="pagination" aria-label="صفحه‌بندی"><button disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronRight /></button><span>صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}</span><button disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronLeft /></button></nav>
}
