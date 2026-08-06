import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit2, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

function ProductFormModal({ product, categories, onClose, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category?._id || product?.category || '',
    price: product?.price || '',
    mrp: product?.mrp || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    tags: (product?.tags || []).join(', '),
    gender: product?.gender || 'unisex',
    frameShape: product?.frameDetails?.shape || '',
    frameMaterial: product?.frameDetails?.material || '',
    frameWidth: product?.frameDetails?.width || '',
  })
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const fileRef = useRef()

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.mrp || !form.category) return toast.error('Please fill all required fields.')
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      images.forEach((img) => fd.append('images', img))

      if (isEdit) {
        await api.put(`/admin/products/${product._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product updated!')
      } else {
        await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Product created!')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.')
    } finally {
      setLoading(false)
    }
  }

  const previewUrls = images.map((f) => URL.createObjectURL(f))
  const existingImages = product?.variants?.[0]?.images || []

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--primary-light)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '640px', margin: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '18px' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div><label className="label">Product Name *</label><input value={form.name} onChange={set('name')} placeholder="Premium Eyeglass Frame" className="input" /></div>
            <div><label className="label">Brand *</label><input value={form.brand} onChange={set('brand')} placeholder="Ray-Ban" className="input" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label className="label">Category *</label>
              <select value={form.category} onChange={set('category')} className="input">
                <option value="">Select Category</option>
                {(categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Price (₹) *</label><input value={form.price} onChange={set('price')} type="number" placeholder="999" className="input" /></div>
            <div><label className="label">MRP (₹) *</label><input value={form.mrp} onChange={set('mrp')} type="number" placeholder="1499" className="input" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="label">Gender</label>
              <select value={form.gender} onChange={set('gender')} className="input">
                {['men', 'women', 'kids', 'unisex'].map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="label">Frame Shape</label><input value={form.frameShape} onChange={set('frameShape')} placeholder="round, aviator..." className="input" /></div>
          </div>
          <div>
            <label className="label">Short Description</label>
            <input value={form.shortDescription} onChange={set('shortDescription')} placeholder="One-line description for product cards" className="input" />
          </div>
          <div>
            <label className="label">Full Description</label>
            <textarea value={form.description} onChange={set('description')} placeholder="Detailed product description..." rows={4} className="input" style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input value={form.tags} onChange={set('tags')} placeholder="bestseller, new-arrival, sale" className="input" />
          </div>

          {/* Image Upload */}
          <div>
            <label className="label"><ImageIcon size={13} style={{ marginRight: '6px' }} />Product Images</label>
            {existingImages.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {existingImages.map((img, i) => (
                  <img key={i} src={img.url} alt="" style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                ))}
              </div>
            )}
            <div
              onClick={() => fileRef.current.click()}
              style={{ border: '2px dashed var(--border)', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Click to upload images (JPG, PNG, WebP)</p>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={(e) => setImages(Array.from(e.target.files))} />
            </div>
            {previewUrls.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {previewUrls.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--accent)' }} />
                    <button
                      type="button"
                      onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                    ><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [formProduct, setFormProduct] = useState(undefined) // undefined = closed, null = create, {...} = edit

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search, category, page }],
    queryFn: () => api.get('/products', { params: { search, category, page, limit: 20, admin: true } }).then((r) => r.data.data),
    staleTime: 30 * 1000,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data.categories),
    staleTime: 10 * 60 * 1000,
  })

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/admin/products/${id}`)
      queryClient.invalidateQueries(['admin-products'])
      toast.success('Product deleted.')
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  const products = data?.products || []
  const pagination = data?.pagination || {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Products ({pagination.total || 0})</h1>
        <button onClick={() => setFormProduct(null)} className="btn btn-primary btn-sm">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flex: '1 1 240px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 12px', alignItems: 'center' }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', flex: 1, fontFamily: 'Outfit, sans-serif' }} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" style={{ width: 'auto', fontSize: '13px' }}>
          <option value="">All Categories</option>
          {(categories || []).map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['Product', 'Category', 'Price / MRP', 'Stock', 'Rating', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}><td colSpan={7} style={{ padding: '14px 16px' }}><div className="skeleton" style={{ height: 40, borderRadius: 8 }} /></td></tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>
              ) : products.map((p) => {
                const img = p.variants?.[0]?.images?.[0]?.url
                const totalStock = p.variants?.reduce((s, v) => s + v.stock, 0) || 0

                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {img ? (
                          <img src={img} alt="" style={{ width: 44, height: 44, borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: '8px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🕶️</div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--accent)' }}>{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{p.category?.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700 }}>₹{p.price?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{p.mrp?.toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: totalStock === 0 ? '#ef4444' : totalStock <= 5 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>{totalStock}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: 600 }}>
                      {p.ratingAvg > 0 ? `${p.ratingAvg.toFixed(1)} ★` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: p.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', color: p.isActive ? '#22c55e' : '#6b7280', fontWeight: 600 }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setFormProduct(p)} className="btn btn-outline btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="btn btn-danger btn-sm" style={{ fontSize: '11px', padding: '4px 10px' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

      {/* Product Form Modal */}
      {formProduct !== undefined && (
        <ProductFormModal
          product={formProduct}
          categories={categories}
          onClose={() => setFormProduct(undefined)}
          onSaved={() => queryClient.invalidateQueries(['admin-products'])}
        />
      )}
    </div>
  )
}
