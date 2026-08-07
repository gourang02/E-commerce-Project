import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, Star, Package, Truck, RefreshCw, Shield } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import api from '../lib/axios'
import useCartStore from '../store/cartStore'
import { SkeletonText } from '../components/common/Skeleton'
import ProductCard from '../components/product/ProductCard'

function ImageGallery({ images }) {
  const [active, setActive] = useState(0)
  const [zoomStyle, setZoomStyle] = useState({})
  const imgs = images?.length ? images : [{ url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop' }]

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: 'scale(1.8)' })
  }

  return (
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
      {/* Main Image */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1/1', background: 'var(--surface-elevated)', cursor: 'zoom-in' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomStyle({})}
      >
        <img
          src={imgs[active].url}
          alt="Product"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.1s ease', ...zoomStyle }}
        />
        {imgs.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + imgs.length) % imgs.length)}
              className="btn btn-ghost btn-icon glass"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            ><ChevronLeft size={16} /></button>
            <button
              onClick={() => setActive((a) => (a + 1) % imgs.length)}
              className="btn btn-ghost btn-icon glass"
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}
            ><ChevronRight size={16} /></button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 64, height: 64, borderRadius: '8px', overflow: 'hidden', padding: 0, cursor: 'pointer',
                border: `2px solid ${i === active ? 'var(--accent)' : 'var(--border)'}`,
                transition: 'var(--transition)',
              }}
            >
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, isLoading: cartLoading } = useCartStore()

  const [selectedVariant, setSelectedVariant] = useState(null)
  const [selectedLens, setSelectedLens] = useState(null)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState('description')

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then((r) => r.data.data),
  })

  if (isLoading) return (
    <div className="page-container" style={{ padding: '40px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: '16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SkeletonText width="40%" height={12} />
          <SkeletonText width="80%" height={28} />
          <SkeletonText width="60%" height={16} />
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
      <h2>Product not found</h2>
      <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>Browse All Products</Link>
    </div>
  )

  const { product, reviews, related } = data
  const variant = selectedVariant || product.variants?.[0]
  const currentImages = variant?.images?.length ? variant.images : []
  const stock = variant?.stock || 0
  const discountPct = product.discount || Math.round(((product.mrp - product.price) / product.mrp) * 100)

  const handleAddToCart = async () => {
    if (!variant) return
    const result = await addToCart(product._id, variant._id, qty, selectedLens)
    if (result.success) {
      // Optional: navigate to cart
    }
  }

  const handleBuyNow = async () => {
    if (!variant) return
    await addToCart(product._id, variant._id, qty, selectedLens)
    navigate('/cart')
  }

  return (
    <div style={{ paddingBottom: '100px' }}>
      <Helmet>
        <title>{`${product.name} by ${product.brand} | Raunak Opticals`}</title>
        <meta name="description" content={product.shortDescription || `Buy ${product.name} frame online. Best price, premium quality, customized prescription lenses available.`} />
      </Helmet>
      <div className="page-container" style={{ paddingTop: '32px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/products" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Products</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'start' }}>
          {/* Images */}
          <ImageGallery images={currentImages} />

          {/* Details */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{product.brand}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, marginBottom: '16px', lineHeight: 1.2 }}>{product.name}</h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={15} fill={s <= Math.round(product.ratingAvg) ? 'var(--accent)' : 'none'} stroke={s <= Math.round(product.ratingAvg) ? 'var(--accent)' : 'var(--text-muted)'} />
                  ))}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{product.ratingAvg}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>₹{product.price.toLocaleString('en-IN')}</span>
              {product.mrp > product.price && (
                <>
                  <span className="price-mrp" style={{ fontSize: '18px' }}>₹{product.mrp.toLocaleString('en-IN')}</span>
                  <span style={{ background: '#22c55e', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700 }}>
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>{product.shortDescription}</p>
            )}

            {/* Color Variant Selector */}
            {product.variants?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
                  Color: <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{variant?.color}</span>
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.variants.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariant(v)}
                      title={v.color}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: v.colorCode || '#888',
                        border: `3px solid ${variant?._id === v._id ? 'var(--accent)' : 'transparent'}`,
                        outline: `2px solid ${variant?._id === v._id ? 'var(--accent)' : 'transparent'}`,
                        cursor: 'pointer', transition: 'var(--transition)',
                        opacity: v.stock === 0 ? 0.3 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Lens Options */}
            {product.lensOptions?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Lens Type</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.lensOptions.map((lens) => (
                    <button
                      key={lens}
                      onClick={() => setSelectedLens(lens === selectedLens ? null : lens)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                        border: `1px solid ${selectedLens === lens ? 'var(--accent)' : 'var(--border)'}`,
                        background: selectedLens === lens ? 'rgba(212,175,55,0.15)' : 'transparent',
                        color: selectedLens === lens ? 'var(--accent)' : 'var(--text-muted)',
                        transition: 'var(--transition)', textTransform: 'capitalize',
                      }}
                    >{lens.replace(/-/g, ' ')}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            {stock <= 5 && stock > 0 && (
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#f59e0b', fontWeight: 500 }}>
                ⚡ Only {stock} left in stock!
              </div>
            )}
            {stock === 0 && (
              <div style={{ marginBottom: '16px', fontSize: '13px', color: '#ef4444', fontWeight: 500 }}>
                ❌ Out of Stock
              </div>
            )}

            {/* Qty + Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{ padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '18px' }}
                >−</button>
                <span style={{ padding: '10px 16px', fontWeight: 600, minWidth: '48px', textAlign: 'center' }}>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(stock, q + 1))}
                  disabled={qty >= stock}
                  style={{ padding: '10px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '18px' }}
                >+</button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={stock === 0 || cartLoading}
                className="btn btn-outline"
                style={{ flex: 1, minWidth: '140px' }}
              >
                <ShoppingCart size={16} />
                {cartLoading ? 'Adding...' : 'Add to Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={stock === 0}
                className="btn btn-primary"
                style={{ flex: 1, minWidth: '140px' }}
              >
                Buy Now
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { icon: <Truck size={16} />, text: 'Free delivery above ₹500' },
                { icon: <RefreshCw size={16} />, text: '7-day easy returns' },
                { icon: <Shield size={16} />, text: 'Certified quality' },
                { icon: <Package size={16} />, text: 'Secure packaging' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)' }}>{b.icon}</span>
                  {b.text}
                </div>
              ))}
            </div>

            {/* Frame Specs */}
            {product.frameDetails && Object.keys(product.frameDetails).length > 0 && (
              <div style={{ background: 'var(--surface-elevated)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--accent)' }}>Frame Specifications</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(product.frameDetails).filter(([, v]) => v).map(([key, value]) => (
                    <div key={key} style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}: </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{value}{typeof value === 'number' ? 'mm' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs: Description / Reviews */}
        <div style={{ marginTop: '64px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '32px', gap: '4px' }}>
            {['description', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600,
                  color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                  transition: 'var(--transition)', textTransform: 'capitalize',
                }}
              >{tab} {tab === 'reviews' && `(${product.reviewCount})`}</button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '700px' }}>
              {product.description}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to review!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '700px' }}>
                  {reviews.map((r) => (
                    <div key={r._id} className="card" style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'var(--gradient-gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, flexShrink: 0, color: 'var(--primary)',
                        }}>
                          {r.user?.name?.[0] || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.user?.name}</div>
                          <div style={{ display: 'flex', gap: '2px', marginTop: '2px' }}>
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} style={{ color: s <= r.rating ? 'var(--accent)' : 'var(--text-muted)', fontSize: '12px' }}>★</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      {r.title && <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>{r.title}</div>}
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {related?.length > 0 && (
          <div style={{ marginTop: '64px' }}>
            <h2 className="section-title" style={{ marginBottom: '24px' }}>You May Also Like</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
