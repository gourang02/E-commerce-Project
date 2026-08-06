import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'
import useAuthStore from '../../store/authStore'

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a special character', pass: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ]
  const score = checks.filter((c) => c.pass).length
  const levels = ['', 'weak', 'fair', 'strong']
  const colors = ['', '#ef4444', '#f59e0b', '#22c55e']

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[1, 2, 3].map((l) => (
          <div key={l} style={{ flex: 1, height: 4, borderRadius: 2, background: l <= score ? colors[score] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s ease' }} />
        ))}
      </div>
      {password && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {checks.map((c) => (
            <div key={c.label} style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: c.pass ? '#22c55e' : 'var(--text-muted)' }}>
              <CheckCircle size={10} style={{ opacity: c.pass ? 1 : 0.3 }} />
              {c.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Signup() {
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const { signup, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required.'
    if (form.username.length < 3) errs.username = 'Username must be at least 3 characters.'
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = 'Only letters, numbers, underscores.'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.'
    if (!/^[6-9]\d{9}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number.'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (!/\d/.test(form.password)) errs.password = 'Must contain at least one number.'
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) errs.password = 'Must contain at least one special character.'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) return setErrors(errs)
    setErrors({})

    const result = await signup({ name: form.name, username: form.username, email: form.email, phone: form.phone, password: form.password })
    if (result.success) {
      navigate('/', { replace: true })
    } else {
      setErrors({ form: result.message })
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 70% 60%, rgba(212,175,55,0.05) 0%, transparent 60%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🕶️</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--accent)', margin: '0 0 4px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Join Raunak Opticals today</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {errors.form && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#ef4444' }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="label">Full Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="Raunak Sharma" className={`input ${errors.name ? 'error' : ''}`} />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </div>
              <div>
                <label className="label">Username *</label>
                <input value={form.username} onChange={set('username')} placeholder="raunak_s" className={`input ${errors.username ? 'error' : ''}`} />
                {errors.username && <p className="error-text">{errors.username}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email Address *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="raunak@email.com" className={`input ${errors.email ? 'error' : ''}`} autoComplete="email" />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Mobile Number *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '15px', color: 'var(--text-muted)', flexShrink: 0 }}>🇮🇳 +91</div>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" className={`input ${errors.phone ? 'error' : ''}`} maxLength={10} />
              </div>
              {errors.phone && <p className="error-text">{errors.phone}</p>}
            </div>

            <div>
              <label className="label">Password *</label>
              <div style={{ position: 'relative' }}>
                <input value={form.password} onChange={set('password')} type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" className={`input ${errors.password ? 'error' : ''}`} style={{ paddingRight: '44px' }} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && <PasswordStrength password={form.password} />}
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Confirm Password *</label>
              <input value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="Repeat your password" className={`input ${errors.confirmPassword ? 'error' : ''}`} autoComplete="new-password" />
              {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0' }}>
              By signing up, you agree to our{' '}
              <Link to="/terms-of-service" style={{ color: 'var(--accent)' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy-policy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
            </p>

            <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {isLoading ? 'Creating Account...' : <><ArrowRight size={16} /> Create Account</>}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
