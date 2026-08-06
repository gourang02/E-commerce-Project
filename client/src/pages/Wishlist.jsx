import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import ProductCard from '../components/product/ProductCard'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/axios'
import toast from 'react-hot-toast'

export default function Wishlist() {
  const { user, updateUser } = useAuthStore()
  const { addToCart, isLoading: cartLoading } = useCartStore()
  const queryClient = useQueryClient()

  // Refetch profile to get fresh populated wishlist
  const { data: freshUser, isLoading } = useQuery({
    queryKey: ['wishlist-items'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data.user),
    initialData: user,
  })

  const wishlist = freshUser?.wishlist || []

  const handleRemove = async (productId) => {
    try {
      await api.post('/cart/wishlist/toggle', { productId })
      // Update local auth store state
      const updatedWishlist = wishlist.filter((item) => (item._id || item) !== productId)
      updateUser({ wishlist: updatedWishlist })
      queryClient.setQueryData(['wishlist-items'], (old) => {
        if (!old) return old
        return { ...old, wishlist: old.wishlist.filter((p) => p._id !== productId) }
      })
      toast.success('Removed from wishlist.')
    } catch {
      toast.error('Failed to remove item.')
    }
  }

  const handleAddToCart = async (product) => {
    const firstVariant = product.variants?.[0]
    if (!firstVariant) return toast.error('Product variants are unavailable.')
    await addToCart(product._id, firstVariant._id, 1)
  }

  if (isLoading) return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '32px' }}>My Wishlist</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: 260, borderRadius: '12px' }} />
        ))}
      </div>
    </div>
  )

  if (wishlist.length === 0) return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
      <Heart size={72} style={{ color: 'var(--text-muted)', marginBottom: '24px', opacity: 0.4 }} />
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Your wishlist is empty</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Save items you love here to purchase them later.</p>
      <Link to="/products" className="btn btn-primary btn-lg">
        Explore Products <ArrowRight size={16} />
      </Link>
    </div>
  )

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>My Wishlist</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>
        {wishlist.length} item(s) saved
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {wishlist.map((product, i) => {
          // Resolve main image from first variant
          const mainImage = product.variants?.[0]?.images?.[0]?.url || 'https://via.placeholder.com/400x300/1e1e38/d4af37?text=🕶%'

          return (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="product-card"
              style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}
            >
              <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#1a1a2e' }}>
                  <img src={mainImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={(e) => { e.preventDefault(); handleRemove(product._id) }}
                    className="btn btn-ghost btn-icon glass"
                    style={{ position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', color: '#ef4444' }}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div style={{ padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    {product.brand}
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </h3>
                  <div style={{ fontWeight: 700 }}>₹{product.price?.toLocaleString('en-IN')}</div>
                </div>
              </Link>

              <div style={{ padding: '0 14px 14px' }}>
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={cartLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                >
                  <ShoppingCart size={13} /> Add to Cart
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
