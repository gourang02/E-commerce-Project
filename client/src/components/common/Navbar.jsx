import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingCart, Heart, User, Menu, X, ChevronDown, LogOut, Package, Settings } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'

const categories = [
  { label: 'Eyeglasses', sub: ['Men', 'Women', 'Kids', 'Unisex'], slug: 'eyeglasses' },
  { label: 'Sunglasses', sub: ['Men', 'Women', 'Kids'], slug: 'sunglasses' },
  { label: 'Contact Lenses', sub: ['Daily', 'Monthly', 'Colored'], slug: 'contact-lenses' },
  { label: 'Computer Glasses', sub: [], slug: 'computer-glasses' },
  { label: 'Reading Glasses', sub: [], slug: 'reading-glasses' },
  { label: 'Accessories', sub: ['Cases', 'Cleaning Kits'], slug: 'accessories' },
]

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { itemCount } = useCartStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeCat, setActiveCat] = useState(null)
  const searchRef = useRef(null)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15, 15, 35, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
      {/* Announcement Bar */}
      <div style={{ background: 'var(--gradient-gold)', padding: '6px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', margin: 0, letterSpacing: '0.05em' }}>
          🕶️ FREE DELIVERY on orders above ₹500 | Use code <strong>FIRST10</strong> for 10% off!
        </p>
      </div>

      <div className="page-container" style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '64px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: 'var(--gradient-gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            🕶️
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
              Raunak
            </div>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              OPTICALS
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'none', gap: '4px', flex: 1, justifyContent: 'center' }} className="desktop-nav">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              style={{ position: 'relative' }}
              onMouseEnter={() => setActiveCat(cat.slug)}
              onMouseLeave={() => setActiveCat(null)}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '8px 12px', borderRadius: '6px', textDecoration: 'none',
                  fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
                  transition: 'var(--transition)', whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(212,175,55,0.07)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
              >
                {cat.label}
                {cat.sub.length > 0 && <ChevronDown size={12} />}
              </Link>

              {cat.sub.length > 0 && activeCat === cat.slug && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0,
                    background: 'var(--primary-light)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '8px', minWidth: '160px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  {cat.sub.map((sub) => (
                    <Link
                      key={sub}
                      to={`/products?category=${cat.slug}&gender=${sub.toLowerCase()}`}
                      style={{
                        display: 'block', padding: '8px 14px', borderRadius: '6px',
                        textDecoration: 'none', fontSize: '13px', color: 'var(--text-secondary)',
                        transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(212,175,55,0.07)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      {sub}
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>

        {/* Right Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          {/* Search */}
          <div style={{ position: 'relative' }} ref={searchRef}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search"
            >
              <Search size={20} />
            </button>
            <AnimatePresence>
              {searchOpen && (
                <motion.form
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleSearch}
                  style={{
                    position: 'absolute', right: 0, top: '48px',
                    background: 'var(--primary-light)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '12px', width: '280px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search glasses, brands..."
                      className="input"
                      style={{ flex: 1, fontSize: '13px' }}
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Search size={14} />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Wishlist */}
          {isAuthenticated && (
            <Link to="/wishlist" className="btn btn-ghost btn-icon" title="Wishlist">
              <Heart size={20} />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="btn btn-ghost btn-icon" title="Cart" style={{ position: 'relative' }}>
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                background: 'var(--accent)', color: 'var(--primary)',
                width: '16px', height: '16px', borderRadius: '50%',
                fontSize: '10px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => isAuthenticated ? setUserMenuOpen(!userMenuOpen) : navigate('/login')}
              title={isAuthenticated ? 'Account' : 'Login'}
            >
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <User size={20} />
              )}
            </button>

            <AnimatePresence>
              {isAuthenticated && userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  style={{
                    position: 'absolute', right: 0, top: '48px',
                    background: 'var(--primary-light)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '8px', minWidth: '200px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</div>
                  </div>
                  {[
                    { to: '/profile', icon: <User size={15} />, label: 'My Profile' },
                    { to: '/orders', icon: <Package size={15} />, label: 'My Orders' },
                    ...(user?.role === 'admin' ? [{ to: '/admin', icon: <Settings size={15} />, label: 'Admin Panel' }] : []),
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 14px', borderRadius: '8px', textDecoration: 'none',
                        fontSize: '13px', color: 'var(--text-secondary)', transition: 'var(--transition)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(212,175,55,0.07)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                      padding: '9px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: 'transparent', fontSize: '13px', color: '#ef4444', marginTop: '6px',
                      borderTop: '1px solid var(--border)', transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="btn btn-ghost btn-icon mobile-only"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', background: 'var(--primary-light)', borderTop: '1px solid var(--border)' }}
          >
            <div style={{ padding: '16px' }}>
              <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search glasses, brands..."
                  className="input"
                />
              </form>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/products?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  style={{ display: 'block', padding: '12px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '15px' }}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .mobile-only { display: none !important; }
        }
      `}</style>
    </header>
  )
}
