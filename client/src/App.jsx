import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect, Suspense, lazy } from 'react'
import { HelmetProvider } from 'react-helmet-async'

import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import BottomNav from './components/common/BottomNav'
import useAuthStore from './store/authStore'
import useCartStore from './store/cartStore'

import Home from './pages/Home'
import ProductListing from './pages/ProductListing'

// ── Lazy load secondary pages ─────────────────────────────────────
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Wishlist = lazy(() => import('./pages/Wishlist'))

// Placeholder pages (to be built in Phase 4-7)
const Placeholder = ({ title }) => (
  <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
    <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h2>
    <p>This page is coming soon in the next phase.</p>
  </div>
)

// ── Route Guards ─────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return children
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

// ── App Initializer ──────────────────────────────────────────────
function AppInit() {
  const { fetchMe } = useAuthStore()
  const { fetchCart } = useCartStore()

  useEffect(() => {
    // Ensure guest session ID exists for cart
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`)
    }
    fetchMe()
    fetchCart()
  }, [])

  return null
}

// ── Page Loader ──────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'float 1.5s ease-in-out infinite' }}>🕶️</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  )
}

// ── QueryClient ──────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ── Layout ───────────────────────────────────────────────────────
function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh' }}>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}

// ── App ──────────────────────────────────────────────────────────
export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppInit />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#d4af37', secondary: '#0f0f23' } },
            }}
          />

          <Routes>
            {/* Auth (no layout) */}
            <Route path="/login" element={<GuestRoute><Suspense fallback={<PageLoader />}><Login /></Suspense></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Suspense fallback={<PageLoader />}><Signup /></Suspense></GuestRoute>} />
            <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />

            {/* Main pages (with layout) */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/products" element={<Layout><ProductListing /></Layout>} />
            <Route path="/products/:slug" element={<Layout><ProductDetail /></Layout>} />
            <Route path="/cart" element={<Layout><Cart /></Layout>} />

            {/* Protected pages */}
            <Route path="/checkout" element={<ProtectedRoute><Layout><Checkout /></Layout></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><Layout><OrderDetail /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><Layout><Wishlist /></Layout></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/*" element={<AdminRoute><Suspense fallback={<PageLoader />}><AdminLayout /></Suspense></AdminRoute>} />

            {/* Static pages */}
            <Route path="/frame-size-guide" element={<Layout><Placeholder title="Frame Size Guide" /></Layout>} />
            <Route path="/privacy-policy" element={<Layout><Placeholder title="Privacy Policy" /></Layout>} />
            <Route path="/terms-of-service" element={<Layout><Placeholder title="Terms of Service" /></Layout>} />

            {/* 404 */}
            <Route path="*" element={<Layout><div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}><div style={{ fontSize: '64px', marginBottom: '16px' }}>404</div><h2 style={{ color: 'var(--accent)', marginBottom: '8px' }}>Page Not Found</h2><p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The page you're looking for doesn't exist.</p><a href="/" className="btn btn-primary">Go Home</a></div></Layout>} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}
