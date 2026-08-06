import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingBag, Users, Package, DollarSign, Eye, Star, Clock } from 'lucide-react'
import api from '../../lib/axios'

function StatCard({ label, value, sub, icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'var(--surface-elevated)', borderRadius: '14px',
        border: '1px solid var(--border)', padding: '22px 20px',
        display: 'flex', gap: '16px', alignItems: 'center',
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

function MiniBar({ label, value, max }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
      <div style={{ width: 100, fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--gradient-gold)', borderRadius: '3px', transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ width: 60, fontSize: '12px', color: 'var(--text-primary)', textAlign: 'right', fontWeight: 600 }}>₹{value?.toLocaleString('en-IN')}</div>
    </div>
  )
}

const STATUS_COLORS = {
  placed: '#3b82f6',
  confirmed: 'var(--accent)',
  packed: '#8b5cf6',
  shipped: '#06b6d4',
  'out-for-delivery': '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#ef4444',
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data.data),
    staleTime: 60 * 1000,
  })

  const stats = data?.stats || {}
  const recentOrders = data?.recentOrders || []
  const topProducts = data?.topProducts || []
  const ordersByStatus = data?.ordersByStatus || []

  if (isLoading) return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 14 }} />)}
      </div>
    </div>
  )

  const maxRevByStatus = Math.max(...ordersByStatus.map((s) => s.revenue || 0), 1)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Welcome back, {stats.adminName || 'Admin'} 👋</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} sub="All time" icon={<DollarSign size={20} />} color="var(--accent)" delay={0} />
        <StatCard label="Total Orders" value={stats.totalOrders || 0} sub={`${stats.todayOrders || 0} today`} icon={<ShoppingBag size={20} />} color="#3b82f6" delay={0.05} />
        <StatCard label="Products" value={stats.totalProducts || 0} sub={`${stats.lowStock || 0} low stock`} icon={<Package size={20} />} color="#8b5cf6" delay={0.1} />
        <StatCard label="Customers" value={stats.totalUsers || 0} sub={`${stats.newUsersToday || 0} today`} icon={<Users size={20} />} color="#22c55e" delay={0.15} />
        <StatCard label="Avg Order Value" value={`₹${(stats.avgOrderValue || 0).toLocaleString('en-IN')}`} icon={<TrendingUp size={20} />} color="#f59e0b" delay={0.2} />
        <StatCard label="Avg Rating" value={`${(stats.avgRating || 0).toFixed(1)} ★`} sub={`${stats.pendingReviews || 0} pending`} icon={<Star size={20} />} color="#ef4444" delay={0.25} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Revenue by status */}
        <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '15px' }}>Revenue by Order Status</h3>
          {ordersByStatus.length > 0 ? ordersByStatus.map((s) => (
            <MiniBar key={s._id} label={s._id?.replace(/-/g, ' ')} value={s.revenue} max={maxRevByStatus} />
          )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No data yet.</p>}
        </div>

        {/* Top Products */}
        <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '15px' }}>Top Products</h3>
          {topProducts.length > 0 ? topProducts.map((p, i) => (
            <div key={p._id} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '6px', background: i === 0 ? 'var(--gradient-gold)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: i === 0 ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.soldCount} sold</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>₹{p.price?.toLocaleString('en-IN')}</div>
            </div>
          )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sales data yet.</p>}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '15px' }}>Recent Orders</h3>
          <a href="/admin/orders" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>View All →</a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders yet.</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{order.orderNumber}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{order.user?.name || 'Guest'}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{order.items?.length}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{order.pricing?.total?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: order.paymentInfo?.status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: order.paymentInfo?.status === 'paid' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                      {order.paymentInfo?.status === 'paid' ? 'Paid' : order.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: `${STATUS_COLORS[order.orderStatus] || '#888'}18`, color: STATUS_COLORS[order.orderStatus] || '#888', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {order.orderStatus?.replace(/-/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
