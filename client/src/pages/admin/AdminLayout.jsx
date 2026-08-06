import { useState } from 'react'
import { Link, useLocation, Outlet, Routes, Route, Navigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Star, Settings, Menu, X, TrendingUp, Bell } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import AdminDashboard from './AdminDashboard'
import AdminOrders from './AdminOrders'
import AdminProducts from './AdminProducts'
import AdminUsers from './AdminUsers'
import AdminCoupons from './AdminCoupons'
import AdminReviews from './AdminReviews'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, exact: true },
  { to: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
  { to: '/admin/products', label: 'Products', icon: <Package size={18} /> },
  { to: '/admin/users', label: 'Customers', icon: <Users size={18} /> },
  { to: '/admin/coupons', label: 'Coupons', icon: <Tag size={18} /> },
  { to: '/admin/reviews', label: 'Reviews', icon: <Star size={18} /> },
]

function AdminNavItem({ item, collapsed }) {
  const location = useLocation()
  const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  return (
    <Link
      to={item.to}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: collapsed ? '12px' : '10px 14px',
        borderRadius: '8px', textDecoration: 'none',
        fontSize: '14px', fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
        background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
        border: isActive ? '1px solid rgba(212,175,55,0.2)' : '1px solid transparent',
        transition: 'var(--transition)',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}
      title={collapsed ? item.label : ''}
    >
      <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  )
}

export default function AdminLayout() {
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface)' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      )}

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 230,
        background: 'var(--primary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width var(--transition)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        overflowX: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? '20px 12px' : '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>Raunak</div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          )}
          {collapsed && <span style={{ fontSize: '22px' }}>🕶️</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost btn-icon" style={{ display: 'none' }} id="collapse-btn">
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => <AdminNavItem key={item.to} item={item} collapsed={collapsed} />)}
        </nav>

        {/* User info */}
        <div style={{ padding: collapsed ? '12px' : '16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '13px', flexShrink: 0 }}>
            {user?.name?.[0] || 'A'}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: collapsed ? 60 : 230, transition: 'margin-left var(--transition)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{ height: 56, background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-icon" style={{ display: 'none' }} id="mobile-menu-btn">
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
            <TrendingUp size={14} style={{ color: 'var(--accent)' }} />
            <span>Admin Dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link to="/" className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>← View Store</Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Routes>
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); }
          #mobile-menu-btn { display: flex !important; }
          .admin-main { margin-left: 0 !important; }
        }
        #collapse-btn { display: flex !important; }
      `}</style>
    </div>
  )
}


