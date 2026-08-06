import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Package, Truck, Home, CheckCircle2, XCircle, RotateCcw, MapPin, CreditCard, ArrowLeft } from 'lucide-react'
import api from '../lib/axios'
import toast from 'react-hot-toast'

const ORDER_STEPS = [
  { key: 'placed', label: 'Placed', icon: <Package size={16} /> },
  { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle2 size={16} /> },
  { key: 'packed', label: 'Packed', icon: <Package size={16} /> },
  { key: 'shipped', label: 'Shipped', icon: <Truck size={16} /> },
  { key: 'out-for-delivery', label: 'Out for Delivery', icon: <Truck size={16} /> },
  { key: 'delivered', label: 'Delivered', icon: <Home size={16} /> },
]

export default function OrderDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [showSuccessModal, setShowSuccessModal] = useState(isSuccess)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data.data.order),
  })

  const order = data

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a cancellation reason.')
    setCancelLoading(true)
    try {
      await api.post(`/orders/${id}/cancel`, { reason: cancelReason })
      queryClient.invalidateQueries(['order', id])
      queryClient.invalidateQueries(['my-orders'])
      toast.success('Order cancelled successfully.')
      setShowCancelModal(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.')
    } finally {
      setCancelLoading(false)
    }
  }

  if (isLoading) return (
    <div className="page-container" style={{ paddingTop: '40px' }}>
      <div className="skeleton" style={{ height: 24, width: '40%', borderRadius: 6, marginBottom: 32 }} />
      <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
    </div>
  )

  if (error || !order) return (
    <div style={{ textAlign: 'center', padding: '80px' }}>
      <XCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
      <h2>Order not found</h2>
      <Link to="/orders" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Back to Orders</Link>
    </div>
  )

  const isCancellable = ['placed', 'confirmed', 'packed'].includes(order.orderStatus)
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === order.orderStatus)
  const isCancelledOrReturned = ['cancelled', 'returned', 'refunded'].includes(order.orderStatus)

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      {/* Success Banner */}
      {/* Success Modal Popup (Myntra-style) */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(10px)', zIndex: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="card"
            style={{
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              borderRadius: '24px', padding: '36px', width: '100%', maxWidth: '480px',
              textAlign: 'center', boxShadow: 'var(--shadow-glow), 0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Celebration radial light burst */}
            <div style={{
              position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
              width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(205, 161, 44, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none'
            }} />

            {/* Checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
              style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(22, 163, 74, 0.12)', border: '2px solid #16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: '#16a34a'
              }}
            >
              <CheckCircle2 size={40} />
            </motion.div>

            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: 800, color: 'var(--accent)', margin: '0 0 8px' }}>
              Order Placed! 🎉
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px', lineHeight: 1.5 }}>
              Thank you! Your order has been placed successfully and is being processed.
            </p>

            {/* Order Brief Summary Card */}
            <div style={{
              background: 'var(--primary-light)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left',
              fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{order.orderNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
                <strong style={{ color: 'var(--accent)', fontSize: '15px' }}>₹{order.pricing?.total?.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {order.paymentInfo?.method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                </strong>
              </div>
            </div>

            {/* Delivery address display */}
            {order.shippingAddress && (
              <div style={{
                borderTop: '1px dashed var(--border)', paddingTop: '16px',
                textAlign: 'left', marginBottom: '28px', fontSize: '13px'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px' }}>
                  <MapPin size={12} /> Delivery Address
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{order.shippingAddress.fullName}</strong>
                  <div>{order.shippingAddress.addressLine1}</div>
                  {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
                  <div>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</div>
                  <div style={{ marginTop: '4px', fontSize: '12px' }}>📱 {order.shippingAddress.phone}</div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/products" className="btn btn-outline" style={{ flex: 1, fontSize: '13px', padding: '10px' }}>
                Continue Shopping
              </Link>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="btn btn-primary"
                style={{ flex: 1, fontSize: '13px', padding: '10px' }}
              >
                Track Order
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Back link */}
      <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      {/* Order header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{order.orderNumber}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {isCancellable && (
            <button onClick={() => setShowCancelModal(true)} className="btn btn-danger btn-sm">
              <XCircle size={14} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Status Stepper */}
      {!isCancelledOrReturned ? (
        <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '28px' }}>Order Status</h3>
          <div style={{ display: 'flex', alignItems: 'flex-start', overflow: 'auto' }}>
            {ORDER_STEPS.map((s, i) => {
              const isDone = i < currentStepIndex
              const isCurrent = i === currentStepIndex

              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', flex: i < ORDER_STEPS.length - 1 ? 1 : 0, minWidth: '80px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: isDone ? 'rgba(212,175,55,0.15)' : isCurrent ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isDone || isCurrent ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isDone ? 'var(--accent)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                      transition: 'var(--transition)', flexShrink: 0,
                      ...(isCurrent && { boxShadow: '0 0 0 6px rgba(212,175,55,0.15)' }),
                    }}>
                      {isDone ? '✓' : s.icon}
                    </div>
                    <span style={{ fontSize: '11px', color: isDone || isCurrent ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap', textAlign: 'center' }}>{s.label}</span>
                    {order.statusHistory?.find((h) => h.status === s.key) && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          {new Date(order.statusHistory.find((h) => h.status === s.key).timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {order.statusHistory.find((h) => h.status === s.key).note && (
                          <span style={{ fontSize: '9px', color: 'var(--accent)', fontWeight: 600, textAlign: 'center', maxWidth: '80px', lineHeight: 1.2 }}>
                            📍 {order.statusHistory.find((h) => h.status === s.key).note}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: isDone ? 'var(--accent)' : 'rgba(255,255,255,0.1)', margin: '18px 8px', transition: 'var(--transition)' }} />
                  )}
                </div>
              )
            })}
          </div>

          {order.trackingNumber && (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              📦 Tracking Number: <strong style={{ color: 'var(--accent)' }}>{order.trackingNumber}</strong>
              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', marginLeft: '12px' }}>Track →</a>}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <XCircle size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontWeight: 700, color: '#ef4444', margin: '0 0 4px' }}>Order {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}</h3>
              {order.cancelReason && <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Reason: {order.cancelReason}</p>}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Order Items */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Items Ordered</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {order.items?.map((item) => (
              <div key={item._id} style={{ display: 'flex', gap: '12px' }}>
                <img src={item.image || 'https://via.placeholder.com/64x64/1e1e38/d4af37?text=🕶️'} alt={item.name} style={{ width: 64, height: 64, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{item.name}</div>
                  {item.color && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Color: {item.color}</div>}
                  {item.lensOption && <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Lens: {item.lensOption.replace(/-/g, ' ')}</div>}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Qty: {item.qty}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Price breakdown */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              <CreditCard size={14} style={{ marginRight: '6px' }} />Price Details
            </h3>
            {[
              { label: 'Subtotal', value: `₹${order.pricing?.subtotal?.toLocaleString('en-IN')}` },
              order.pricing?.couponDiscount > 0 && { label: 'Coupon Discount', value: `-₹${order.pricing.couponDiscount.toLocaleString('en-IN')}`, green: true },
              { label: 'Delivery', value: order.pricing?.deliveryCharge === 0 ? 'FREE' : `₹${order.pricing?.deliveryCharge}`, green: order.pricing?.deliveryCharge === 0 },
              { label: 'GST', value: `₹${order.pricing?.tax?.toLocaleString('en-IN')}` },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span style={{ color: row.green ? '#22c55e' : 'var(--text-secondary)' }}>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Total Paid</span>
              <span style={{ color: 'var(--accent)', fontSize: '18px' }}>₹{order.pricing?.total?.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Payment: {order.paymentInfo?.method === 'online' ? `💳 Online (${order.paymentInfo.status === 'paid' ? 'Paid' : 'Pending'})` : '💵 Cash on Delivery'}
            </div>
          </div>

          {/* Delivery address */}
          {order.shippingAddress && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                <MapPin size={14} style={{ marginRight: '6px' }} />Delivery Address
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.7, margin: 0, color: 'var(--text-secondary)' }}>
                <strong>{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && <><br />{order.shippingAddress.addressLine2}</>}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}<br />
                📱 {order.shippingAddress.phone}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ padding: '32px', width: '100%', maxWidth: '460px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '12px' }}>Cancel Order?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>This action cannot be undone. Please select a reason for cancellation.</p>
            
            {/* Cancellation fee alert */}
            <div style={{
              background: 'rgba(220, 38, 38, 0.06)', border: '1px solid rgba(220, 38, 38, 0.15)',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
              fontSize: '13px', color: 'var(--error)', fontWeight: 600,
              lineHeight: 1.4
            }}>
              ⚠️ Refund Policy Alert: 50% of the order value (₹{((order.pricing?.total || 0) * 0.5).toFixed(0)}) will be deducted as a cancellation fee.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="label">Reason *</label>
              <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input">
                <option value="">Select a reason</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found better price elsewhere">Found better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery time too long">Delivery time too long</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowCancelModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>Keep Order</button>
              <button onClick={handleCancel} disabled={cancelLoading} className="btn btn-danger" style={{ flex: 1 }}>
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
