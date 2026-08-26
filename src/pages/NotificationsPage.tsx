import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, LoaderCircle, MessageCircleMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../features/dashboard/dashboardApi'

export function NotificationsPage() {
  const { data: dashboard, isPending, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, retry: false })
  const lowStock = dashboard?.low_stock ?? []
  const wanted = dashboard?.wanted ?? []

  return (
    <div className="page list-page notifications">
      <div className="activity-list card">
        {isPending && <div className="loading-state"><LoaderCircle className="spin" /><span>در حال دریافت هشدارها...</span></div>}
        {isError && <div className="error-state"><AlertTriangle /><strong>دریافت هشدارها ناموفق بود</strong></div>}
        {!isPending && !isError && (lowStock.length === 0 && wanted.length === 0) && (
          <div className="muted-empty">🎉 هیچ هشداری ندارید.</div>
        )}
        {!isPending && !isError && lowStock.length > 0 && (
          <>
            <h3 className="section-title">کم‌موجودی ({lowStock.length.toLocaleString('fa-IR')})</h3>
            {lowStock.map((item) => (
              <Link to="/inventory" key={`low-${item.product_name}-${item.size}`} className="activity-item">
                <span className="activity-icon danger"><AlertTriangle /></span>
                <p><strong>محصول کم‌موجود</strong><small>{item.product_name} سایز {item.size} — {item.current_stock.toLocaleString('fa-IR')} عدد موجود است.</small></p>
                <ArrowLeft size={16} />
              </Link>
            ))}
          </>
        )}
        {!isPending && !isError && wanted.length > 0 && (
          <>
            <h3 className="section-title">تقاضا ({wanted.length.toLocaleString('fa-IR')})</h3>
            {wanted.map((item) => (
              <Link to="/requests" key={`wanted-${item.product_name}-${item.size}`} className="activity-item">
                <span className="activity-icon purple"><MessageCircleMore /></span>
                <p><strong>تقاضای پرتکرار</strong><small>{item.product_name} سایز {item.size}، {item.wanted_count.toLocaleString('fa-IR')} درخواست دارد.</small></p>
                <ArrowLeft size={16} />
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
