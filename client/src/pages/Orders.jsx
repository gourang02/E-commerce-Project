import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ChevronRight, RotateCcw } from 'lucide-react'
import api from '../lib/axios'
import { SkeletonText } from '../components/common/Skeleton'

const STATUS_COLORS = {
  placed: 'var(--info)',
  confirmed: 'var(--accent)',
  packed: '#8b5cf6',
  shipped: '#3b82f6',
  'out-for-delivery': '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  returned: '#6b7280',
  refunded: '#10b981',
}

const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
}

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders').then((r) => r.data.data),
  })

  const orders = data?.orders || []

  if (isLoading) return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>My Orders</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '8px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}><SkeletonText width="50%" height={16} style={{ marginBottom: 8 }} /><SkeletonText width="30%" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!orders.length) return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
      <Package size={72} style={{ color: 'var(--text-muted)', marginBottom: '24px', opacity: 0.4 }} />
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>No orders yet</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Your order history will appear here.</p>
      <Link to="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
    </div>
  )

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>My Orders</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>{data?.total} orders placed</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map((order, i) => {
          const statusColor = STATUS_COLORS[order.orderStatus] || 'var(--text-muted)'
          const firstItem = order.items?.[0]

          return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link to={`/orders/${order._id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {/* Item preview image */}
                  <img
                    src={firstItem?.image || 'https://via.placeholder.com/64x64/1e1e38/d4af37?text=🕶️'}
                    alt=""
                    style={{ width: 64, height: 64, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                  />

                  {/* Order info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{order.orderNumber}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40`,
                      }}>
                        {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {order.items?.length} item(s) · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {order.expectedDelivery && !['cancelled', 'delivered', 'returned'].includes(order.orderStatus) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Expected: {new Date(order.expectedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                    {order.orderStatus === 'delivered' && (
                      <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 500 }}>✓ Delivered successfully</div>
                    )}
                  </div>

                  {/* Total + chevron */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent)', marginBottom: '2px' }}>
                      ₹{order.pricing?.total?.toLocaleString('en-IN')}
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
