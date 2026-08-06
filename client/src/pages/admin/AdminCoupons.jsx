import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Tag, Trash2, X, Percent, DollarSign } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

function CouponFormModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.code || !form.value || !form.expiryDate) {
      return toast.error('Code, Value and Expiry Date are required.')
    }
    setLoading(true)
    try {
      await api.post('/admin/coupons', form)
      toast.success('Coupon created successfully!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '17px' }}>Create Promo Coupon</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="label">Promo Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. FIRST10, SUPER500" className="input" autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% Off on first purchase" className="input" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Coupon Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="label">Value *</label>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percentage' ? '10' : '200'} className="input" type="number" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Min Order (₹)</label>
              <input value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="499" className="input" type="number" />
            </div>
            <div>
              <label className="label">Max Discount (₹)</label>
              <input value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="e.g. 500 (Optional)" className="input" type="number" disabled={form.type === 'flat'} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Expiry Date *</label>
              <input value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="input" type="date" />
            </div>
            <div>
              <label className="label">Usage Limit</label>
              <input value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="100 (Optional)" className="input" type="number" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminCoupons() {
  const queryClient = useQueryClient()
  const [openModal, setOpenModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/admin/coupons').then((r) => r.data.data),
  })

  const coupons = data?.coupons || []

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return
    try {
      await api.delete(`/admin/coupons/${id}`)
      queryClient.invalidateQueries(['admin-coupons'])
      toast.success('Coupon deleted.')
    } catch {
      toast.error('Deletion failed.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Coupons & Offers</h1>
        <button onClick={() => setOpenModal(true)} className="btn btn-primary btn-sm">
          <Plus size={15} /> Add Coupon
        </button>
      </div>

      <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['Code', 'Description', 'Discount', 'Min Order', 'Max Discount', 'Expiry', 'Usage', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}><td colSpan={8} style={{ padding: '14px 16px' }}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td></tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No coupons created yet.</td></tr>
              ) : coupons.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--accent)' }}>{c.code}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{c.description || '—'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                    {c.type === 'percentage' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Percent size={12} /> {c.value}% Off</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><DollarSign size={12} /> ₹{c.value} Off</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>₹{c.minOrderValue || 0}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{c.maxDiscount ? `₹${c.maxDiscount}` : 'No Cap'}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'used'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleDelete(c._id, c.code)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {openModal && (
        <CouponFormModal
          onClose={() => setOpenModal(false)}
          onSaved={() => queryClient.invalidateQueries(['admin-coupons'])}
        />
      )}
    </div>
  )
}
