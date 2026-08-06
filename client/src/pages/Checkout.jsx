import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, MapPin, CreditCard, ShieldCheck, CheckCircle2, Truck, Smartphone } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/axios'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 'address', label: 'Address', icon: <MapPin size={16} /> },
  { id: 'payment', label: 'Payment', icon: <CreditCard size={16} /> },
  { id: 'review', label: 'Review', icon: <ShieldCheck size={16} /> },
]

// Load Razorpay script
function loadRazorpay() {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) return resolve(true)
    const s = document.createElement('script')
    s.id = 'razorpay-sdk'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { cart, items, pricing, clearCart } = useCartStore()
  const [step, setStep] = useState('address')
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses?.find((a) => a.isDefault)?._id || user?.addresses?.[0]?._id || null)
  const [showAddressForm, setShowAddressForm] = useState(!user?.addresses?.length)
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [deliveryOption, setDeliveryOption] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [newAddress, setNewAddress] = useState({ label: 'Home', fullName: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const hasCheckedCart = useRef(false)

  useEffect(() => {
    if (!hasCheckedCart.current) {
      if (!items || items.length === 0) {
        navigate('/cart')
      }
      hasCheckedCart.current = true
    }
  }, [items, navigate])

  // Quick address save
  const handleSaveAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      return toast.error('Please fill all required address fields.')
    }
    try {
      const { data } = await api.post('/auth/addresses', newAddress)
      const saved = data.data.addresses
      setSelectedAddressId(saved[saved.length - 1]._id)
      setShowAddressForm(false)
      toast.success('Address saved!')
    } catch {
      toast.error('Failed to save address.')
    }
  }

  const selectedAddress = user?.addresses?.find((a) => a._id?.toString() === selectedAddressId?.toString())

  // Place order
  const handlePlaceOrder = async () => {
    if (!selectedAddressId && !showAddressForm) return toast.error('Please select a delivery address.')
    setLoading(true)
    try {
      const { data } = await api.post('/orders/create', {
        shippingAddressId: selectedAddressId,
        paymentMethod,
        deliveryOption,
        couponCode: cart?.couponCode,
      })

      if (paymentMethod === 'online') {
        // Open Razorpay checkout
        const loaded = await loadRazorpay()
        if (!loaded) { toast.error('Payment gateway failed to load. Try COD.'); setLoading(false); return }

        const options = {
          key: data.data.razorpayKeyId,
          amount: data.data.amount,
          currency: data.data.currency,
          name: 'Raunak Opticals',
          description: `Order ${data.data.order.orderNumber}`,
          image: '🕶️',
          order_id: data.data.razorpayOrderId,
          handler: async (response) => {
            try {
              await api.post('/orders/verify-payment', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              clearCart()
              navigate(`/orders/${data.data.order._id}?success=true`)
            } catch {
              toast.error('Payment verification failed. Contact support.')
            }
          },
          prefill: { name: user?.name, email: user?.email, contact: `91${user?.phone}` },
          theme: { color: '#d4af37' },
          modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled.') } },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
        setLoading(false)
      } else {
        // COD success
        clearCart()
        navigate(`/orders/${data.data.order._id}?success=true`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order.')
      setLoading(false)
    }
  }

  if (!items?.length && !hasCheckedCart.current) {
    return null
  }

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '120px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>Checkout</h1>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', maxWidth: '400px' }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: i < stepIndex ? 'var(--accent)' : i === stepIndex ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${i <= stepIndex ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: i < stepIndex ? 'var(--primary)' : i === stepIndex ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'var(--transition)',
              }}>
                {i < stepIndex ? '✓' : s.icon}
              </div>
              <span style={{ fontSize: '11px', color: i === stepIndex ? 'var(--accent)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < stepIndex ? 'var(--accent)' : 'rgba(255,255,255,0.1)', margin: '0 8px', marginBottom: '20px', transition: 'var(--transition)' }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'start' }}>
        {/* Left: step content */}
        <div style={{ flex: '2 1 400px' }}>
          <AnimatePresence mode="wait">
            {/* STEP 1: Address */}
            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} style={{ color: 'var(--accent)' }} /> Delivery Address
                </h2>

                {/* Saved addresses */}
                {user?.addresses?.length > 0 && !showAddressForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {user.addresses.map((addr) => (
                      <div
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className="card"
                        style={{ padding: '16px', cursor: 'pointer', border: `2px solid ${selectedAddressId === addr._id?.toString() ? 'var(--accent)' : 'var(--border)'}`, transition: 'var(--transition)' }}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedAddressId === addr._id?.toString() ? 'var(--accent)' : 'var(--border)'}`,
                            background: selectedAddressId === addr._id?.toString() ? 'var(--accent)' : 'transparent',
                            flexShrink: 0, marginTop: '2px',
                          }} />
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px' }}>{addr.fullName}</span>
                              <span className="badge badge-gold" style={{ fontSize: '10px' }}>{addr.label}</span>
                              {addr.isDefault && <span className="badge badge-success" style={{ fontSize: '10px' }}>Default</span>}
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                              {addr.city}, {addr.state} — {addr.pincode}<br />
                              📱 {addr.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new address button */}
                {!showAddressForm && (
                  <button onClick={() => setShowAddressForm(true)} className="btn btn-outline btn-sm" style={{ marginBottom: '24px' }}>
                    + Add New Address
                  </button>
                )}

                {/* New address form */}
                {showAddressForm && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>New Address</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="label">Full Name *</label>
                          <input value={newAddress.fullName} onChange={(e) => setNewAddress((a) => ({ ...a, fullName: e.target.value }))} placeholder="Raunak Sharma" className="input" />
                        </div>
                        <div>
                          <label className="label">Phone *</label>
                          <input value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" className="input" maxLength={10} />
                        </div>
                      </div>
                      <div>
                        <label className="label">Address Line 1 *</label>
                        <input value={newAddress.addressLine1} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine1: e.target.value }))} placeholder="Flat/House No., Street, Area" className="input" />
                      </div>
                      <div>
                        <label className="label">Address Line 2</label>
                        <input value={newAddress.addressLine2} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine2: e.target.value }))} placeholder="Landmark (optional)" className="input" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label className="label">City *</label>
                          <input value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))} placeholder="Delhi" className="input" />
                        </div>
                        <div>
                          <label className="label">State *</label>
                          <input value={newAddress.state} onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))} placeholder="Delhi" className="input" />
                        </div>
                        <div>
                          <label className="label">Pincode *</label>
                          <input value={newAddress.pincode} onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="110001" className="input" maxLength={6} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSaveAddress} className="btn btn-primary btn-sm">Save Address</button>
                        {user?.addresses?.length > 0 && <button onClick={() => setShowAddressForm(false)} className="btn btn-ghost btn-sm">Cancel</button>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Delivery option */}
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>Delivery Speed</h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'standard', label: 'Standard Delivery', desc: '5–7 business days', price: pricing?.deliveryCharge === 0 ? 'FREE' : '₹49', icon: <Truck size={18} /> },
                    { id: 'express', label: 'Express Delivery', desc: '1–2 business days', price: '₹149', icon: <Smartphone size={18} /> },
                  ].map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setDeliveryOption(opt.id)}
                      className="card"
                      style={{ padding: '16px', cursor: 'pointer', flex: '1 1 200px', border: `2px solid ${deliveryOption === opt.id ? 'var(--accent)' : 'var(--border)'}`, transition: 'var(--transition)' }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ color: deliveryOption === opt.id ? 'var(--accent)' : 'var(--text-muted)' }}>{opt.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{opt.label}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: opt.price === 'FREE' ? '#22c55e' : 'var(--text-primary)', marginTop: '4px' }}>{opt.price}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (!selectedAddressId) return toast.error('Select or add a delivery address.')
                    setStep('payment')
                  }}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                >
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Payment */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} style={{ color: 'var(--accent)' }} /> Payment Method
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {/* Online Payment */}
                  <div
                    onClick={() => setPaymentMethod('online')}
                    className="card"
                    style={{ padding: '20px', cursor: 'pointer', border: `2px solid ${paymentMethod === 'online' ? 'var(--accent)' : 'var(--border)'}`, transition: 'var(--transition)' }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === 'online' ? 'var(--accent)' : 'var(--border)'}`, background: paymentMethod === 'online' ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>
                          💳 Online Payment
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>UPI, Credit/Debit Card, Net Banking, Wallets</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {['UPI', 'Visa', 'Mastercard', 'NetBanking', 'Wallets'].map((p) => (
                            <span key={p} style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '10px', color: 'var(--text-muted)' }}>{p}</span>
                          ))}
                        </div>
                      </div>
                      <img src="https://razorpay.com/favicon.png" alt="Razorpay" style={{ width: 32, height: 32, borderRadius: '4px', opacity: 0.8 }} onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  </div>

                  {/* COD */}
                  <div
                    onClick={() => pricing?.total <= 5000 ? setPaymentMethod('cod') : toast.error('COD not available for orders above ₹5,000.')}
                    className="card"
                    style={{ padding: '20px', cursor: pricing?.total <= 5000 ? 'pointer' : 'not-allowed', opacity: pricing?.total > 5000 ? 0.5 : 1, border: `2px solid ${paymentMethod === 'cod' ? 'var(--accent)' : 'var(--border)'}`, transition: 'var(--transition)' }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === 'cod' ? 'var(--accent)' : 'var(--border)'}`, background: paymentMethod === 'cod' ? 'var(--accent)' : 'transparent', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>💵 Cash on Delivery</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pay when your order arrives · Available up to ₹5,000</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStep('address')} className="btn btn-outline" style={{ flex: 1 }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={() => setStep('review')} className="btn btn-primary" style={{ flex: 2 }}>
                    Review Order <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Review */}
            {step === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--accent)' }} /> Review & Confirm
                </h2>

                {/* Order summary */}
                <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Items ({items.length})</h4>
                  {items.map((item) => (
                    <div key={item._id} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <img src={item.product?.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/56x56/1e1e38/d4af37?text=🕶️'} alt="" style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.product?.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Qty: {item.qty}</div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>₹{((item.currentPrice || 0) * item.qty).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>

                {/* Delivery address summary */}
                {selectedAddress && (
                  <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Delivering To</h4>
                    <p style={{ fontSize: '13px', lineHeight: 1.7, margin: 0, color: 'var(--text-secondary)' }}>
                      <strong>{selectedAddress.fullName}</strong><br />
                      {selectedAddress.addressLine1}, {selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}<br />
                      📱 {selectedAddress.phone}
                    </p>
                  </div>
                )}

                {/* Payment summary */}
                <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Payment</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    {paymentMethod === 'online' ? '💳 Online Payment via Razorpay' : '💵 Cash on Delivery'} · {deliveryOption === 'express' ? '⚡ Express' : '🚚 Standard'} Delivery
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStep('payment')} className="btn btn-outline" style={{ flex: 1 }}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn btn-primary btn-lg" style={{ flex: 2 }}>
                    {loading ? 'Processing...' : paymentMethod === 'online' ? `Pay ₹${pricing?.total?.toLocaleString('en-IN')}` : 'Place Order'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Price Summary (sticky) */}
        <div style={{ flex: '1 1 280px', position: 'sticky', top: '80px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '16px' }}>Price Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: `Subtotal (${items.length} items)`, value: `₹${(pricing?.subtotal || 0).toLocaleString('en-IN')}` },
                { label: 'Discount', value: `-₹${(pricing?.productDiscount || 0).toLocaleString('en-IN')}`, green: true },
                pricing?.couponDiscount > 0 && { label: 'Coupon Discount', value: `-₹${pricing.couponDiscount.toLocaleString('en-IN')}`, green: true },
                { label: 'Delivery', value: pricing?.deliveryCharge === 0 ? 'FREE 🎉' : `₹${pricing?.deliveryCharge || 0}`, green: pricing?.deliveryCharge === 0 },
                { label: 'GST (5%)', value: `₹${(pricing?.tax || 0).toLocaleString('en-IN')}` },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ color: row.green ? '#22c55e' : 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '22px', color: 'var(--accent)' }}>₹{(pricing?.total || 0).toLocaleString('en-IN')}</span>
            </div>
            {pricing?.productDiscount > 0 && (
              <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '8px', padding: '10px', marginTop: '12px', fontSize: '13px', color: '#22c55e', textAlign: 'center' }}>
                🎉 You save ₹{(pricing.productDiscount + (pricing.couponDiscount || 0)).toLocaleString('en-IN')} on this order!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
