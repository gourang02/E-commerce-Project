import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, Star, Award } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = { page, limit: 20, ...(search && { search }) }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get('/admin/users', { params }).then((r) => r.data.data),
    staleTime: 30 * 1000,
  })

  const users = data?.users || []
  const total = data?.total || 0

  const handleToggleBlock = async (userId, currentActive) => {
    const actStr = currentActive ? 'block' : 'unblock'
    if (!window.confirm(`Are you sure you want to ${actStr} this user?`)) return
    try {
      await api.put(`/admin/users/${userId}/toggle-block`)
      queryClient.invalidateQueries(['admin-users'])
      toast.success(`User successfully ${currentActive ? 'blocked' : 'unblocked'}.`)
    } catch {
      toast.error('Operation failed.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Customer Management ({total})</h1>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', maxDraw: '320px' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 12px', alignItems: 'center' }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', flex: 1, fontFamily: 'Outfit, sans-serif' }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface-elevated)', borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['Customer', 'Username', 'Loyalty Points', 'Joined Date', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i}><td colSpan={6} style={{ padding: '14px 16px' }}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email} · {u.phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>@{u.username}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: 600 }}>
                      <Award size={13} /> {u.loyaltyPoints || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: u.isActive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {u.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleToggleBlock(u._id, u.isActive)}
                      className={u.isActive ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                      style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {u.isActive ? <><UserX size={11} /> Block</> : <><UserCheck size={11} /> Unblock</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
