import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Smartphone } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function Login() {
  const [mode, setMode] = useState('password') // 'password' | 'otp'
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { login } = useAuthStore()
  const { fetchCart } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!identifier.trim()) return setErrors({ identifier: 'Email or username is required.' })
    if (!password) return setErrors({ password: 'Password is required.' })

    setLoading(true)
    const result = await login(identifier, password)
    setLoading(false)

    if (result.success) {
      await fetchCart()
      toast.success('Welcome back! 👋')
      navigate(from, { replace: true })
    } else {
      setErrors({ form: result.message })
    }
  }

  const handleSendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return setErrors({ phone: 'Enter a valid 10-digit Indian mobile number.' })
    }
    setSending(true)
    try {
      const { data } = await api.post('/auth/send-otp', { phone, purpose: 'login' })
      setOtpSent(true)
      setErrors({})
      const otpCode = data?.data?.debugOtp
      toast.success(otpCode ? `OTP sent! Verification Code: ${otpCode}` : 'OTP sent! Check your messages.')
    } catch (err) {
      setErrors({ phone: err.response?.data?.message || 'Failed to send OTP.' })
    } finally {
      setSending(false)
    }
  }

  const handleOTPLogin = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return setErrors({ otp: 'Enter the 6-digit OTP.' })
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp, purpose: 'login' })
      const { user, accessToken } = data.data
      useAuthStore.getState().setUser(user, accessToken)
      await fetchCart()
      toast.success('Welcome! 👋')
      navigate(from, { replace: true })
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid OTP.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 30% 40%, rgba(212,175,55,0.05) 0%, transparent 60%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🕶️</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--accent)', margin: '0 0 4px' }}>Raunak Opticals</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
            <button
              onClick={() => { setMode('password'); setErrors({}) }}
              style={{
                flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: mode === 'password' ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: mode === 'password' ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '13px', transition: 'var(--transition)',
              }}
            >Password</button>
            <button
              onClick={() => { setMode('otp'); setErrors({}) }}
              style={{
                flex: 1, padding: '8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                background: mode === 'otp' ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: mode === 'otp' ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: '13px', transition: 'var(--transition)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            ><Smartphone size={13} /> Mobile OTP</button>
          </div>

          {errors.form && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#ef4444' }}>
              {errors.form}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Email or Username</label>
                <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="john@email.com or john_doe" className={`input ${errors.identifier ? 'error' : ''}`} autoComplete="username" />
                {errors.identifier && <p className="error-text">{errors.identifier}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="••••••••" className={`input ${errors.password ? 'error' : ''}`} autoComplete="current-password" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="error-text">{errors.password}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none' }}>Forgot Password?</Link>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                {loading ? 'Signing in...' : <><ArrowRight size={16} /> Sign In</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Mobile Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '15px', color: 'var(--text-muted)', flexShrink: 0 }}>🇮🇳 +91</div>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className={`input ${errors.phone ? 'error' : ''}`}
                    maxLength={10}
                  />
                </div>
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
              {!otpSent ? (
                <button type="button" onClick={handleSendOTP} disabled={sending} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {sending ? 'Sending...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="label">Enter OTP</label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      className={`input ${errors.otp ? 'error' : ''}`}
                      style={{ letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center' }}
                      maxLength={6}
                    />
                    {errors.otp && <p className="error-text">{errors.otp}</p>}
                    <button type="button" onClick={handleSendOTP} disabled={sending} style={{ fontSize: '12px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px' }}>
                      {sending ? 'Resending...' : 'Resend OTP'}
                    </button>
                  </div>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </>
              )}
            </form>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign Up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
