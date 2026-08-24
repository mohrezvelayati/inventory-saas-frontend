import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { RequestsPage } from './pages/RequestsPage'
import { SalesPage } from './pages/SalesPage'
import { MorePage } from './pages/MorePage'
import { LoginPage, RegisterPage, StoreSetupPage } from './pages/AuthPages'
import { SaleCreatePage } from './pages/SaleCreatePage'
import { CategoriesPage, CustomersPage, InventoryHistoryPage, InventoryPage, MembersPage } from './pages/OperationsPages'
import { ProductDetailPage, SaleDetailPage } from './pages/DetailPages'
import { ProfileSettingsPage, StoreSettingsPage } from './pages/SettingsPages'
import { ReportsPage } from './pages/ReportsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { InvitePage } from './pages/InvitePage'
import { AuthGate, GuestGate, ManagerGate, PermissionGate } from './features/auth/AuthGate'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestGate><LoginPage /></GuestGate>} />
      <Route path="/register" element={<GuestGate><RegisterPage /></GuestGate>} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/onboarding/store" element={<AuthGate requireStore={false}><StoreSetupPage /></AuthGate>} />
      <Route element={<AuthGate><AppShell /></AuthGate>}>
        <Route path="/" element={<PermissionGate anyOf={['view_dashboard']}><HomePage /></PermissionGate>} />
        <Route path="/products" element={<PermissionGate anyOf={['manage_catalog']}><ProductsPage /></PermissionGate>} />
        <Route path="/products/:productId" element={<PermissionGate anyOf={['manage_catalog']}><ProductDetailPage /></PermissionGate>} />
        <Route path="/sales" element={<PermissionGate anyOf={['view_sales', 'create_sale']}><SalesPage /></PermissionGate>} />
        <Route path="/sales/new" element={<PermissionGate anyOf={['create_sale']}><SaleCreatePage /></PermissionGate>} />
        <Route path="/sales/:saleId" element={<PermissionGate anyOf={['view_sales', 'create_sale']}><SaleDetailPage /></PermissionGate>} />
        <Route path="/requests" element={<PermissionGate anyOf={['manage_wanted']}><RequestsPage /></PermissionGate>} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/customers" element={<PermissionGate anyOf={['manage_customers']}><CustomersPage /></PermissionGate>} />
        <Route path="/inventory" element={<PermissionGate anyOf={['view_inventory', 'manage_inventory']}><InventoryPage /></PermissionGate>} />
        <Route path="/inventory/history" element={<PermissionGate anyOf={['view_inventory']}><InventoryHistoryPage /></PermissionGate>} />
        <Route path="/categories" element={<PermissionGate anyOf={['manage_catalog']}><CategoriesPage /></PermissionGate>} />
        <Route path="/members" element={<PermissionGate anyOf={['manage_members']}><MembersPage /></PermissionGate>} />
        <Route path="/profile" element={<ProfileSettingsPage />} />
        <Route path="/settings/store" element={<ManagerGate><StoreSettingsPage /></ManagerGate>} />
        <Route path="/reports" element={<PermissionGate anyOf={['view_dashboard']}><ReportsPage /></PermissionGate>} />
        <Route path="/notifications" element={<PermissionGate anyOf={['view_dashboard']}><NotificationsPage /></PermissionGate>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
