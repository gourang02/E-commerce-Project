import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import api from '../lib/axios'
import ProductCard from '../components/product/ProductCard'
import { SkeletonCard } from '../components/common/Skeleton'

// ── Hero slides ──────────────────────────────────────────────────
const heroSlides = [
  {
    id: 1,
    tag: 'New Collection 2024',
    title: 'See the World in\nStyle & Clarity',
    subtitle: 'Premium eyewear crafted for those who refuse to compromise on vision or fashion.',
    cta: 'Shop Eyeglasses',
    link: '/products?category=eyeglasses',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    accentColor: '#d4af37',
  },
  {
    id: 2,
    tag: '🕶️ Sunglasses Sale',
    title: 'Summer Ready.\nUpto 50% OFF',
    subtitle: 'Polarized lenses, UV400 protection. From aviators to wayfarers — find your shade.',
    cta: 'Shop Sunglasses',
    link: '/products?category=sunglasses',
    gradient: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #533483 100%)',
    accentColor: '#f0d060',
  },
  {
    id: 3,
    tag: 'Blue Light Protection',
    title: 'Screen Time?\nProtect Your Eyes',
    subtitle: 'Computer glasses with blue-cut technology. Reduce eye strain, sleep better.',
    cta: 'Shop Computer Glasses',
    link: '/products?category=computer-glasses',
    gradient: 'linear-gradient(135deg, #0d1b2a 0%, #1b2a4a 50%, #243b55 100%)',
    accentColor: '#60a5fa',
  },
]

// ── Category tiles ───────────────────────────────────────────────
const categoryTiles = [
  { label: 'Eyeglasses', emoji: '👓', slug: 'eyeglasses', count: '200+ styles' },
  { label: 'Sunglasses', emoji: '🕶️', slug: 'sunglasses', count: '150+ styles' },
  { label: 'Contact Lenses', emoji: '👁️', slug: 'contact-lenses', count: '50+ options' },
  { label: 'Computer Glasses', emoji: '💻', slug: 'computer-glasses', count: '80+ styles' },
  { label: 'Reading Glasses', emoji: '📚', slug: 'reading-glasses', count: '60+ styles' },
  { label: 'Accessories', emoji: '🎒', slug: 'accessories', count: '40+ items' },
]

// ── Deal countdown timer ─────────────────────────────────────────
function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState({})
  useEffect(() => {
    const calc = () => {
      const diff = target - Date.now()
      if (diff <= 0) return setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [target])
  return timeLeft
}

function CountdownTimer({ target }) {
  const { hours = 0, minutes = 0, seconds = 0 } = useCountdown(target)
  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {[['Hours', hours], ['Mins', minutes], ['Secs', seconds]].map(([label, val]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: 'var(--primary)', border: '1px solid var(--accent)',
            borderRadius: '8px', padding: '8px 14px',
            fontFamily: 'monospace', fontSize: '24px', fontWeight: 700, color: 'var(--accent)',
            minWidth: '56px', textAlign: 'center',
          }}>
            {pad(val)}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [heroIdx, setHeroIdx] = useState(0)
  const navigate = useNavigate()

  // Auto-advance hero
  useEffect(() => {
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 5000)
    return () => clearInterval(id)
  }, [])

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: () => api.get('/products/featured').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const dealEnd = useRef(Date.now() + 8 * 3600 * 1000).current // 8 hours from load

  const slide = heroSlides[heroIdx]

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Helmet>
        <title>Raunak Opticals | Buy Eyeglasses, Sunglasses & Lenses Online</title>
        <meta name="description" content="Shop premium glasses online. Wide collection of eyeglasses, sunglasses, and contact lenses for men, women, and kids with fast prescription fitting." />
        <meta name="keywords" content="eyeglasses online, buy sunglasses, contact lenses, optical store, blue cut glasses" />
      </Helmet>
      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute', inset: 0,
              background: slide.gradient,
            }}
          />
        </AnimatePresence>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.08)', top: '-200px', right: '-100px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.05)', bottom: '-150px', left: '-100px', pointerEvents: 'none' }} />

        <div className="page-container" style={{ position: 'relative', zIndex: 2, width: '100%', padding: '80px 16px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ maxWidth: '640px' }}
            >
              <span style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: '100px',
                border: `1px solid ${slide.accentColor}40`,
                background: `${slide.accentColor}15`,
                color: slide.accentColor, fontSize: '12px', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px',
              }}>
                {slide.tag}
              </span>

              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '20px', whiteSpace: 'pre-line' }}>
                {slide.title}
              </h1>

              <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '36px', maxWidth: '480px' }}>
                {slide.subtitle}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to={slide.link} className="btn btn-primary btn-lg">
                  {slide.cta} <ArrowRight size={18} />
                </Link>
                <Link to="/products" className="btn btn-outline btn-lg">
                  Browse All
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
                {[['10K+', 'Happy Customers'], ['500+', 'Brands & Styles'], ['4.8★', 'Average Rating']].map(([num, label]) => (
                  <div key={label}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: slide.accentColor }}>{num}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slide controls */}
        <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 3 }}>
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              style={{
                width: i === heroIdx ? 28 : 8, height: 8, borderRadius: '100px',
                background: i === heroIdx ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                border: 'none', cursor: 'pointer', transition: 'var(--transition)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => setHeroIdx((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}
          className="btn btn-ghost btn-icon glass"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setHeroIdx((i) => (i + 1) % heroSlides.length)}
          style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}
          className="btn btn-ghost btn-icon glass"
        >
          <ChevronRight size={20} />
        </button>
      </section>

      {/* ── CATEGORY TILES ── */}
      <section style={{ padding: '64px 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find the perfect eyewear for every occasion</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {categoryTiles.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={`/products?category=${cat.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div className="card" style={{ padding: '24px 16px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>{cat.emoji}</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>{cat.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.count}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section style={{ padding: '0 0 64px' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="section-title">Best Sellers</h2>
              <p className="section-subtitle">Our most-loved styles, chosen by thousands</p>
            </div>
            <Link to="/products?tag=bestseller" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {featuredLoading
              ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
              : featured?.bestSellers?.map((p) => <ProductCard key={p._id} product={p} />)
            }
          </div>
        </div>
      </section>

      {/* ── DEAL OF THE DAY ── */}
      {featured?.deals?.length > 0 && (
        <section style={{ padding: '64px 0', background: 'var(--primary-light)' }}>
          <div className="page-container">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🔥</span>
                  <h2 className="section-title">Deal of the Day</h2>
                </div>
                <p className="section-subtitle">Limited time offers — grab them before they're gone!</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <Clock size={14} /> Ends in:
                </div>
                <CountdownTimer target={dealEnd} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {featured.deals.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ── */}
      <section style={{ padding: '64px 0' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 className="section-title">New Arrivals</h2>
              <p className="section-subtitle">Fresh styles just landed in our collection</p>
            </div>
            <Link to="/products?tag=new-arrival" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {featuredLoading
              ? Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)
              : featured?.newArrivals?.map((p) => <ProductCard key={p._id} product={p} />)
            }
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section style={{ padding: '64px 0', background: 'var(--primary-light)' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">Why Raunak Opticals?</h2>
            <p className="section-subtitle">Trusted by thousands since 2010</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {[
              { icon: '🏆', title: 'Premium Quality', desc: 'Only certified, tested frames from top brands' },
              { icon: '🔬', title: 'Expert Fitting', desc: 'Professional lens fitting with your prescription' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Delivered to your door in 3–7 days' },
              { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free return policy' },
              { icon: '💰', title: 'Best Prices', desc: 'Manufacturer direct pricing, no middlemen' },
              { icon: '📞', title: '24/7 Support', desc: 'Always here to help you choose the right pair' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
                style={{ padding: '24px', textAlign: 'center' }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '64px 0' }}>
        <div className="page-container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">Real experiences from real people</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {[
              { name: 'Priya S.', city: 'Delhi', rating: 5, text: 'Amazing quality! Got my prescription glasses delivered in 4 days. The frame quality is top-notch and fits perfectly.' },
              { name: 'Rahul M.', city: 'Mumbai', rating: 5, text: 'Finally an optical shop that gets online right. Easy prescription upload, beautiful packaging, and super helpful customer support.' },
              { name: 'Ananya K.', city: 'Bangalore', rating: 5, text: 'Ordered sunglasses for my mom and she absolutely loves them. The price was 40% cheaper than local shops. Will order again!' },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card"
                style={{ padding: '24px' }}
              >
                <div style={{ display: 'flex', gap: '2px', marginBottom: '12px' }}>
                  {Array.from({ length: t.rating }, (_, j) => (
                    <span key={j} style={{ color: 'var(--accent)', fontSize: '14px' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--gradient-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '14px', color: 'var(--primary)',
                  }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.city}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STRIP ── */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '24px' }}>Trusted Brands</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', alignItems: 'center' }}>
            {['Ray-Ban', 'Fastrack', 'Titan Eye+', 'Vincent Chase', 'Oakley', 'Police'].map((brand) => (
              <span key={brand} style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', opacity: 0.6 }}>{brand}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
