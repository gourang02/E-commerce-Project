export function SkeletonCard() {
  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ aspectRatio: '4/3' }} />
      <div style={{ padding: '14px' }}>
        <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 16, width: '80%', marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 10, borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 18, width: 50, borderRadius: 4 }} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ width = '100%', height = 16, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 4, ...style }} />
}

export function SkeletonLine({ lines = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: i === lines - 1 ? '70%' : '100%', borderRadius: 4 }} />
      ))}
    </div>
  )
}
