import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trash2, Plus, Minus, Tag, X, ShoppingBag, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import { SkeletonCard } from '../components/common/Skeleton'

export default function Cart() {
  const { cart, items, pricing, updateItem, removeItem, applyCoupon, removeCoupon, fetchCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Fetch cart on mount
  useQuery({ queryKey: ['cart-init'], queryFn: fetchCart, staleTime: 0 })

  const handleCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    await applyCoupon(couponInput.trim())
    setCouponLoading(false)
    setCouponInput('')
  }

  if (!cart || items.length === 0) return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
      <ShoppingBag size={72} style={{ color: 'var(--text-muted)', marginBottom: '24px', opacity: 0.5 }} />
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Your cart is empty</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Looks like you haven't added anything yet.</p>
      <Link to="/products" className="btn btn-primary btn-lg">
        Start Shopping <ArrowRight size={18} />
      </Link>
    </div>
  )

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '120px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>Shopping Cart ({items.length} items)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start' }}>
        {/* Cart Items */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item, i) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card"
              style={{ padding: '16px', display: 'flex', gap: '16px' }}
            >
              {/* Product Image */}
              <Link to={`/products/${item.product?.slug}`}>
                <img
                  src={item.product?.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/100x100/1e1e38/d4af37?text=🕶️'}
                  alt={item.product?.name}
                  style={{ width: 80, height: 80, borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                />
              </Link>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/products/${item.product?.slug}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product?.name}
                  </h3>
                </Link>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {item.color && <span>Color: {item.color} · </span>}
                  {item.lensOption && <span style={{ textTransform: 'capitalize' }}>Lens: {item.lensOption?.replace(/-/g, ' ')}</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  {/* Qty Control */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <button
                      onClick={() => updateItem(item._id, item.qty - 1)}
                      style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                    ><Minus size={12} /></button>
                    <span style={{ padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}>{item.qty}</span>
                    <button
                      onClick={() => updateItem(item._id, item.qty + 1)}
                      disabled={item.qty >= item.inStock}
                      style={{ padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                    ><Plus size={12} /></button>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>
                      ₹{((item.currentPrice || item.priceAtAdd || 0) * item.qty).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ₹{(item.currentPrice || item.priceAtAdd || 0).toLocaleString('en-IN')} each
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item._id)}
                    className="btn btn-ghost btn-icon"
                    style={{ color: '#ef4444' }}
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ flex: '1 1 280px', position: 'sticky', top: '80px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '16px' }}>Order Summary</h3>

            {/* Coupon */}
            {!cart.couponCode ? (
              <div style={{ marginBottom: '20px' }}>
                <label className="label"><Tag size={12} style={{ marginRight: '6px' }} />Promo Code</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="input"
                    style={{ flex: 1, fontSize: '13px', letterSpacing: '0.1em' }}
                  />
                  <button onClick={handleCoupon} disabled={couponLoading} className="btn btn-outline btn-sm">
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>🎉 {cart.couponCode} applied!</span>
                <button onClick={removeCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }}><X size={14} /></button>
              </div>
            )}

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Subtotal (MRP)', value: `₹${(pricing.mrpTotal || 0).toLocaleString('en-IN')}` },
                pricing.productDiscount > 0 && { label: 'Product Discount', value: `-₹${pricing.productDiscount?.toLocaleString('en-IN')}`, green: true },
                pricing.couponDiscount > 0 && { label: 'Coupon Discount', value: `-₹${pricing.couponDiscount?.toLocaleString('en-IN')}`, green: true },
                { label: 'Delivery', value: pricing.deliveryCharge === 0 ? 'FREE 🎉' : `₹${pricing.deliveryCharge}`, green: pricing.deliveryCharge === 0 },
                { label: 'GST (5%)', value: `₹${(pricing.tax || 0).toLocaleString('en-IN')}` },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: row.green ? '#22c55e' : 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--accent)' }}>₹{(pricing.total || 0).toLocaleString('en-IN')}</span>
            </div>

            {!isAuthenticated ? (
              <div>
                <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', marginBottom: '10px' }}>
                  Checkout as Guest
                </Link>
                <Link to="/login?redirect=checkout" className="btn btn-outline" style={{ width: '100%', display: 'flex', fontSize: '13px' }}>
                  Login for faster checkout
                </Link>
              </div>
            ) : (
              <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex' }}>
                Proceed to Checkout <ArrowRight size={18} />
              </Link>
            )}

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
              🔒 Secured with SSL encryption · Razorpay + COD available
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
