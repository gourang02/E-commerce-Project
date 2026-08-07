import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { Helmet } from 'react-helmet-async'
import api from '../lib/axios'
import ProductCard from '../components/product/ProductCard'
import { SkeletonCard } from '../components/common/Skeleton'

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Most Popular', value: 'soldCount-desc' },
  { label: 'Top Rated', value: 'ratingAvg-desc' },
]

const SHAPES = ['round', 'square', 'rectangle', 'aviator', 'cat-eye', 'wayfarer', 'oval', 'sport']
const GENDERS = ['men', 'women', 'kids', 'unisex']

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600, padding: '8px 0' }}
      >
        {title}
        <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'var(--transition)' }} />
      </button>
      {open && <div style={{ marginTop: '12px' }}>{children}</div>}
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: '100px', fontSize: '12px', cursor: 'pointer',
        border: `1px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
        background: active ? 'rgba(212,175,55,0.15)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'var(--transition)',
      }}
    >{children}</button>
  )
}

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)

  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const tag = searchParams.get('tag') || ''
  const sortParam = searchParams.get('sort') || 'createdAt-desc'
  const [sortField, sortOrder] = sortParam.split('-')

  const [filters, setFilters] = useState({
    shape: searchParams.get('shape') || '',
    gender: searchParams.get('gender') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brand: searchParams.get('brand') || '',
  })

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: f[key] === value ? '' : value }))

  const queryParams = { page, limit: 20, sort: sortField, order: sortOrder, ...(search && { search }), ...(category && { category }), ...(tag && { tag }), ...(filters.shape && { shape: filters.shape }), ...(filters.gender && { gender: filters.gender }), ...(filters.minPrice && { minPrice: filters.minPrice }), ...(filters.maxPrice && { maxPrice: filters.maxPrice }), ...(filters.brand && { brand: filters.brand }) }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => api.get('/products', { params: queryParams }).then((r) => r.data.data),
    keepPreviousData: true,
    staleTime: 0,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data.categories),
    staleTime: 10 * 60 * 1000,
  })

  const products = data?.products || []
  const pagination = data?.pagination || {}

  // Reset page to 1 whenever search, category, tag or filters change
  useEffect(() => {
    setPage(1)
  }, [searchParams, filters])

  // Fallback to page 1 if current page is out of bounds
  useEffect(() => {
    if (products.length === 0 && pagination.total > 0 && page > 1) {
      setPage(1)
    }
  }, [products.length, pagination.total, page])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const FiltersPanel = () => (
    <div style={{ minWidth: '220px', flex: '0 0 220px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Filters {activeFilterCount > 0 && <span className="badge badge-gold" style={{ marginLeft: 6 }}>{activeFilterCount}</span>}</h3>
        {activeFilterCount > 0 && (
          <button onClick={() => setFilters({ shape: '', gender: '', minPrice: '', maxPrice: '', brand: '' })} className="btn btn-ghost btn-sm">
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      {categoriesData?.length > 0 && (
        <FilterSection title="Category">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {categoriesData.filter((c) => !c.parentCategory).map((c) => (
              <Link
                key={c._id}
                to={`/products?category=${c.slug}`}
                style={{
                  fontSize: '13px', padding: '6px 0', color: category === c.slug ? 'var(--accent)' : 'var(--text-muted)',
                  textDecoration: 'none', borderLeft: `2px solid ${category === c.slug ? 'var(--accent)' : 'transparent'}`,
                  paddingLeft: '10px', transition: 'var(--transition)',
                }}
              >{c.name}</Link>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Gender */}
      <FilterSection title="Gender">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {GENDERS.map((g) => (
            <FilterChip key={g} active={filters.gender === g} onClick={() => setFilter('gender', g)}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </FilterChip>
          ))}
        </div>
      </FilterSection>

      {/* Frame Shape */}
      <FilterSection title="Frame Shape">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SHAPES.map((s) => (
            <FilterChip key={s} active={filters.shape === s} onClick={() => setFilter('shape', s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </FilterChip>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            className="input"
            style={{ fontSize: '13px', padding: '8px 10px' }}
            type="number"
          />
          <span style={{ color: 'var(--text-muted)' }}>–</span>
          <input
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            className="input"
            style={{ fontSize: '13px', padding: '8px 10px' }}
            type="number"
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {[['Under ₹500', '0', '500'], ['₹500–₹1500', '500', '1500'], ['₹1500–₹3000', '1500', '3000'], ['Above ₹3000', '3000', '']].map(([label, min, max]) => (
            <FilterChip
              key={label}
              active={filters.minPrice === min && filters.maxPrice === max}
              onClick={() => setFilters((f) => ({ ...f, minPrice: min, maxPrice: max }))}
            >{label}</FilterChip>
          ))}
        </div>
      </FilterSection>
    </div>
  )

  const pageTitle = search ? `Search: "${search}" | Raunak Opticals` : category ? `${category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Collection | Raunak Opticals` : 'Browse Premium Eyewear | Raunak Opticals'

  return (
    <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '100px' }}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`Explore our curated collection of high-quality eyeglasses, sunglasses, and lenses. Find your perfect fit with filters for shape, gender, and price range.`} />
      </Helmet>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>
            {search ? `Search: "${search}"` : category ? category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'All Products'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {pagination.total || 0} products found
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex' }}
          >
            <SlidersHorizontal size={14} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {/* Sort */}
          <select
            value={sortParam}
            onChange={(e) => setSearchParams((p) => { p.set('sort', e.target.value); return p })}
            className="input"
            style={{ width: 'auto', fontSize: '13px', padding: '8px 12px' }}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Desktop Filters Sidebar */}
        <div style={{ display: 'none' }} className="desktop-filters">
          <FiltersPanel />
        </div>

        {/* Products Grid */}
        <div style={{ flex: 1 }}>
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)' }}>No products found</h3>
              <p>Try adjusting your filters or search term</p>
              <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
                View All Products
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {products.map((p, i) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '40px', flexWrap: 'wrap' }}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={p === page ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filtersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setFiltersOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80%', maxWidth: '320px', background: 'var(--primary-light)', padding: '24px', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700 }}>Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="btn btn-ghost btn-icon"><X size={18} /></button>
            </div>
            <FiltersPanel />
            <button onClick={() => setFiltersOpen(false)} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Apply Filters
            </button>
          </motion.div>
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .desktop-filters { display: block !important; }
        }
      `}</style>
    </div>
  )
}
