import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Grid3X3, ShoppingCart, Package, User } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const navItems = [
    { to: '/', icon: <Home size={22} />, label: 'Home' },
    { to: '/products', icon: <Grid3X3 size={22} />, label: 'Shop' },
    { to: '/cart', icon: <ShoppingCart size={22} />, label: 'Cart', badge: itemCount },
    { to: '/orders', icon: <Package size={22} />, label: 'Orders', requireAuth: true },
    { to: isAuthenticated ? '/profile' : '/login', icon: <User size={22} />, label: isAuthenticated ? 'Profile' : 'Login' },
  ]

  return (
    <nav className="bottom-nav" style={{ display: 'flex' }}>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`bottom-nav-item ${location.pathname === item.to ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <span style={{ position: 'relative' }}>
            {item.icon}
            {item.badge > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--accent)', color: 'var(--primary)',
                width: 15, height: 15, borderRadius: '50%',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
