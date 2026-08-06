import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Trash2, Star, MessageSquare } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminReviews() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api.get('/admin/reviews').then((r) => r.data.data),
  })

  const reviews = data?.reviews || []

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/reviews/${id}/approve`)
      queryClient.invalidateQueries(['admin-reviews'])
      toast.success('Review approved!')
    } catch {
      toast.error('Approve failed.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return
    try {
      await api.delete(`/admin/reviews/${id}`)
      queryClient.invalidateQueries(['admin-reviews'])
      toast.success('Review deleted.')
    } catch {
      toast.error('Delete failed.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Review Moderation ({reviews.length})</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />
          ))
        ) : reviews.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <h3>No pending reviews</h3>
            <p>All submitted customer reviews have been moderated.</p>
          </div>
        ) : reviews.map((r) => (
          <div key={r._id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              {/* Product and User */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.user?.name || 'Customer'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>on <span style={{ color: 'var(--accent)' }}>{r.product?.name}</span></div>
                </div>
                <div style={{ display: 'flex', gap: '2px', color: 'var(--accent)' }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} style={{ color: i < r.rating ? 'var(--accent)' : 'var(--text-muted)', fontSize: '12px' }}>★</span>
                  ))}
                </div>
              </div>

              {/* Title & Comment */}
              {r.title && <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{r.title}</div>}
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>"{r.comment}"</p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                onClick={() => handleApprove(r._id)}
                className="btn btn-primary btn-sm"
                style={{ flex: 2, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <Check size={13} /> Approve
              </button>
              <button
                onClick={() => handleDelete(r._id)}
                className="btn btn-danger btn-sm"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px' }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
