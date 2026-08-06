import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, MapPin, Heart, Package, Camera, Trash2, Plus, Star } from 'lucide-react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

function AvatarUpload({ user, onUpload }) {
  const fileRef = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const { data } = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUpload(data.data.user)
      toast.success('Profile photo updated!')
    } catch {
      toast.error('Failed to upload photo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      {user?.avatar?.url ? (
        <img src={user.avatar.url} alt="Avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
      ) : (
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 700, color: 'var(--primary)', border: '3px solid var(--accent)' }}>
          {user?.name?.[0] || '?'}
        </div>
      )}
      <button
        onClick={() => fileRef.current.click()}
        disabled={uploading}
        style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}
        title="Change photo"
      >
        <Camera size={13} />
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ name: user?.name || '', email: user?.email || '' })
  const [saving, setSaving] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({ label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })

  const { data: freshUser, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data.user),
    initialData: user,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders-profile'],
    queryFn: () => api.get('/orders?limit=5').then((r) => r.data.data),
    enabled: activeTab === 'orders',
  })

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', formData)
      updateUser(data.data.user)
      setEditMode(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddress = async () => {
    if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city || !newAddress.pincode) {
      return toast.error('Please fill all required fields.')
    }
    try {
      const { data } = await api.post('/auth/addresses', newAddress)
      updateUser({ addresses: data.data.addresses })
      setShowAddressForm(false)
      setNewAddress({ label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' })
      toast.success('Address saved!')
    } catch {
      toast.error('Failed to save address.')
    }
  }

  const handleDeleteAddress = async (addressId) => {
    try {
      const { data } = await api.delete(`/auth/addresses/${addressId}`)
      updateUser({ addresses: data.data.addresses })
      toast.success('Address deleted.')
    } catch {
      toast.error('Failed to delete address.')
    }
  }

  const handleSetDefault = async (addressId) => {
    try {
      const { data } = await api.patch(`/auth/addresses/${addressId}/default`)
      updateUser({ addresses: data.data.addresses })
      toast.success('Default address updated.')
    } catch { }
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: <User size={15} /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin size={15} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={15} /> },
    { id: 'wishlist', label: 'Wishlist', icon: <Heart size={15} /> },
  ]

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
        <AvatarUpload user={freshUser || user} onUpload={(u) => updateUser(u)} />
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>{freshUser?.name || user?.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 8px' }}>{freshUser?.email || user?.email}</p>
          {freshUser?.loyaltyPoints > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
              <Star size={12} fill="var(--accent)" /> {freshUser.loyaltyPoints} Loyalty Points
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '32px', gap: '4px', overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: activeTab === tab.id ? 700 : 400, whiteSpace: 'nowrap',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
              transition: 'var(--transition)',
            }}
          >{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: '480px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Personal Information</h3>
              <button onClick={() => editMode ? handleSaveProfile() : setEditMode(true)} disabled={saving} className={editMode ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}>
                {editMode ? (saving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Full Name', key: 'name', value: freshUser?.name || user?.name, editable: true },
                { label: 'Username', key: 'username', value: freshUser?.username || user?.username, editable: false },
                { label: 'Email Address', key: 'email', value: freshUser?.email || user?.email, editable: true },
                { label: 'Mobile Number', key: 'phone', value: freshUser?.phone || user?.phone, editable: false },
              ].map((field) => (
                <div key={field.key}>
                  <label className="label">{field.label}</label>
                  {editMode && field.editable ? (
                    <input
                      value={formData[field.key] !== undefined ? formData[field.key] : field.value}
                      onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="input"
                    />
                  ) : (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '15px', color: field.editable ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {field.value || '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px' }}>Saved Addresses</h3>
            <button onClick={() => setShowAddressForm(!showAddressForm)} className="btn btn-outline btn-sm">
              <Plus size={14} /> Add Address
            </button>
          </div>

          {/* Add form */}
          {showAddressForm && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontWeight: 600, marginBottom: '16px' }}>New Address</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label className="label">Full Name *</label><input value={newAddress.fullName} onChange={(e) => setNewAddress((a) => ({ ...a, fullName: e.target.value }))} className="input" placeholder="Raunak Sharma" /></div>
                  <div><label className="label">Phone *</label><input value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="input" placeholder="9876543210" maxLength={10} /></div>
                </div>
                <div><label className="label">Address Line 1 *</label><input value={newAddress.addressLine1} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine1: e.target.value }))} className="input" placeholder="Street, Area" /></div>
                <div><label className="label">Landmark</label><input value={newAddress.addressLine2} onChange={(e) => setNewAddress((a) => ({ ...a, addressLine2: e.target.value }))} className="input" placeholder="Near..." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div><label className="label">City *</label><input value={newAddress.city} onChange={(e) => setNewAddress((a) => ({ ...a, city: e.target.value }))} className="input" placeholder="Delhi" /></div>
                  <div><label className="label">State *</label><input value={newAddress.state} onChange={(e) => setNewAddress((a) => ({ ...a, state: e.target.value }))} className="input" placeholder="Delhi" /></div>
                  <div><label className="label">Pincode *</label><input value={newAddress.pincode} onChange={(e) => setNewAddress((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} className="input" placeholder="110001" maxLength={6} /></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveAddress} className="btn btn-primary btn-sm">Save Address</button>
                  <button onClick={() => setShowAddressForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Address list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(freshUser?.addresses || user?.addresses || []).map((addr) => (
              <div key={addr._id} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{addr.fullName}</span>
                      <span className="badge badge-gold" style={{ fontSize: '10px' }}>{addr.label}</span>
                      {addr.isDefault && <span className="badge badge-success" style={{ fontSize: '10px' }}>Default</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px' }}>
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}<br />📱 {addr.phone}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr._id)} className="btn btn-outline btn-sm" style={{ fontSize: '11px' }}>Set Default</button>
                      )}
                      <button onClick={() => handleDeleteAddress(addr._id)} className="btn btn-danger btn-sm" style={{ fontSize: '11px' }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!(freshUser?.addresses || user?.addresses || []).length && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No saved addresses yet. Add one above!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ maxWidth: '700px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Recent Orders</h3>
          {ordersData?.orders?.length ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ordersData.orders.map((order) => (
                  <Link key={order._id} to={`/orders/${order._id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={order.items?.[0]?.image || 'https://via.placeholder.com/56/1e1e38/d4af37?text=🕶️'} alt="" style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>{order.orderNumber}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items?.length} item(s)</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{order.pricing?.total?.toLocaleString('en-IN')}</div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: 'rgba(212,175,55,0.1)', color: 'var(--accent)' }}>
                          {order.orderStatus.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/orders" className="btn btn-outline" style={{ marginTop: '16px', display: 'inline-flex' }}>View All Orders →</Link>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>No orders yet.</p>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px' }}>Wishlist</h3>
          {(freshUser?.wishlist || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Heart size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Your wishlist is empty.</p>
              <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Browse Products</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {/* Wishlist items rendered by ProductCard if needed */}
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{(freshUser?.wishlist || []).length} items saved</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
