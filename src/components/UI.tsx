import type { LucideIcon } from 'lucide-react'
import { ChevronDown, Search } from 'lucide-react'
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
