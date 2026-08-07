import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

function StarRating({ rating, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div className="stars" style={{ fontSize: '12px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} style={{ color: s <= Math.round(rating) ? 'var(--accent)' : 'var(--text-muted)' }}>★</span>
        ))}
      </div>
      {count > 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({count})</span>}
    </div>
  )
}

export default function ProductCard({ product }) {
  const { addToCart, isLoading } = useCartStore()
  const { isAuthenticated, user, updateUser } = useAuthStore()
  const [isWishlisted, setIsWishlisted] = useState(
    user?.wishlist?.includes(product._id)
  )
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const firstVariant = product.variants?.[0]
  const mainImage = firstVariant?.images?.[0]?.url || 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop'
  const discountPct = product.discount || Math.round(((product.mrp - product.price) / product.mrp) * 100)

  const handleAddToCart = async (e) => {
    e.preventDefault()
    if (!firstVariant) return
    await addToCart(product._id, firstVariant._id, 1)
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error('Please login to save to wishlist.'); return }
    setWishlistLoading(true)
    try {
      const { data } = await api.post('/cart/wishlist/toggle', { productId: product._id })
      setIsWishlisted(!isWishlisted)
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️')
    } catch {
      toast.error('Failed to update wishlist.')
    } finally {
      setWishlistLoading(false)
    }
  }

  return (
    <motion.div
      className="product-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3', background: '#1a1a2e' }}>
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          />

          {/* Discount Badge */}
          {discountPct > 0 && (
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: '#22c55e', color: '#fff',
              padding: '2px 8px', borderRadius: '4px',
              fontSize: '11px', fontWeight: 700,
            }}>
              {discountPct}% OFF
            </div>
          )}

          {/* New Tag */}
          {product.tags?.includes('new-arrival') && (
            <div style={{
              position: 'absolute', top: '10px', right: '40px',
              background: 'var(--accent)', color: 'var(--primary)',
              padding: '2px 8px', borderRadius: '4px',
              fontSize: '11px', fontWeight: 700,
            }}>
              NEW
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            style={{
              position: 'absolute', top: '10px', right: '10px',
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(15,15,35,0.8)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isWishlisted ? '#ef4444' : 'var(--text-muted)',
              transition: 'var(--transition)', backdropFilter: 'blur(8px)',
            }}
          >
            <Heart size={14} fill={isWishlisted ? '#ef4444' : 'none'} />
          </button>

          {/* Quick Add Overlay */}
          <div className="product-card__overlay" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(15,15,35,0.95), transparent)',
            padding: '16px 12px 10px',
          }}>
            <button
              onClick={handleAddToCart}
              disabled={isLoading || !firstVariant}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '12px', padding: '8px' }}
            >
              <ShoppingCart size={14} />
              {isLoading ? 'Adding...' : 'Quick Add'}
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {product.brand}
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </h3>

          <StarRating rating={product.ratingAvg} count={product.reviewCount} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <span className="price-current">₹{product.price.toLocaleString('en-IN')}</span>
            {product.mrp > product.price && (
              <span className="price-mrp">₹{product.mrp.toLocaleString('en-IN')}</span>
            )}
            {discountPct > 0 && (
              <span className="price-discount">{discountPct}% off</span>
            )}
          </div>

          {/* Color swatches */}
          {product.variants?.length > 1 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
              {product.variants.slice(0, 5).map((v) => (
                <div
                  key={v._id}
                  title={v.color}
                  style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: v.colorCode || '#888',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
              ))}
              {product.variants.length > 5 && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{product.variants.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
