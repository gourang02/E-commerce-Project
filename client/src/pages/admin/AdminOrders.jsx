import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, ChevronDown, Eye, Edit2, Truck } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const ALL_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned', 'refunded']

const STATUS_COLORS = {
  placed: '#3b82f6', confirmed: 'var(--accent)', packed: '#8b5cf6',
  shipped: '#06b6d4', 'out-for-delivery': '#f59e0b', delivered: '#22c55e',
  cancelled: '#ef4444', returned: '#6b7280', refunded: '#10b981',
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#888'
  return (
    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '100px', background: `${color}18`, color, border: `1px solid ${color}30`, fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status?.replace(/-/g, ' ')}
    </span>
  )
}

function UpdateStatusModal({ order, onClose, onUpdate }) {
  const [newStatus, setNewStatus] = useState(order.orderStatus)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '')
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await api.put(`/admin/orders/${order._id}/status`, {
        status: newStatus,
        trackingNumber,
        trackingUrl,
        note: note.trim()
      })
      toast.success('Order status updated.')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '20px' }}>Update Order Status</h3>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Order: <strong style={{ color: 'var(--accent)' }}>{order.orderNumber}</strong></div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Customer: {order.user?.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label className="label">New Status</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Warehouse Note / Location Update</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Arrived at Delhi Okhla Warehouse" className="input" />
          </div>
          {['shipped', 'out-for-delivery'].includes(newStatus) && (
            <>
              <div>
                <label className="label">Tracking Number</label>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. DTDC123456789IN" className="input" />
              </div>
              <div>
                <label className="label">Tracking URL (optional)</label>
                <input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://tracking.example.com/..." className="input" />
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleUpdate} disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
            <Truck size={14} /> {loading ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const params = { page, limit: 20, ...(search && { search }), ...(statusFilter && { status: statusFilter }) }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', params],
    queryFn: () => api.get('/admin/orders', { params }).then((r) => r.data.data),
    staleTime: 30 * 1000,
  })

  const orders = data?.orders || []
  const pagination = data?.pagination || {}

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Orders Management</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flex: '1 1 240px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 12px', alignItems: 'center' }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or customer..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', flex: 1, fontFamily: 'Outfit, sans-serif' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input" style={{ width: 'auto', fontSize: '13px' }}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}
        </select>
      </div>

      {/* Status summary pills */}
      {data?.statusCounts && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {Object.entries(data.statusCounts).filter(([, v]) => v > 0).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              style={{
                padding: '4px 12px', borderRadius: '100px', fontSize: '12px', cursor: 'pointer',
                background: statusFilter === status ? `${STATUS_COLORS[status]}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${statusFilter === status ? STATUS_COLORS[status] : 'rgba(255,255,255,0.1)'}`,
                color: statusFilter === status ? STATUS_COLORS[status] : 'var(--text-muted)',
              }}
            >
              {status.replace(/-/g, ' ')} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}><td colSpan={8} style={{ padding: '14px 16px' }}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>{order.orderNumber}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{order.user?.name || 'Guest'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.user?.phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{order.items?.length}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>₹{order.pricing?.total?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: order.paymentInfo?.status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: order.paymentInfo?.status === 'paid' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
                      {order.paymentInfo?.status === 'paid' ? 'Paid' : order.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={order.orderStatus} /></td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '11px' }}
                    >
                      <Edit2 size={11} /> Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '24px' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}>{p}</button>
          ))}
        </div>
      )}

      {/* Update Status Modal */}
      {selectedOrder && (
        <UpdateStatusModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => queryClient.invalidateQueries(['admin-orders'])}
        />
      )}
    </div>
  )
}
