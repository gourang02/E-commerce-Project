import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

const STEPS = ['phone', 'otp', 'newPassword', 'done']

export default function ForgotPassword() {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [tempToken, setTempToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!/^[6-9]\d{9}$/.test(phone)) return setErrors({ phone: 'Enter a valid 10-digit mobile number.' })
    setLoading(true)
    try {
      const { data } = await api.post('/auth/send-otp', { phone, purpose: 'forgot-password' })
      setStep('otp')
      setErrors({})
      const otpCode = data?.data?.debugOtp
      toast.success(otpCode ? `OTP sent! Verification Code: ${otpCode}` : 'OTP sent to your mobile number.')
    } catch (err) {
      setErrors({ phone: err.response?.data?.message || 'Failed to send OTP.' })
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return setErrors({ otp: 'Enter the 6-digit OTP.' })
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp, purpose: 'forgot-password' })
      setTempToken(data.data.tempToken)
      setStep('newPassword')
      setErrors({})
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid OTP. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword.length < 8) return setErrors({ newPassword: 'Password must be at least 8 characters.' })
    if (!/\d/.test(newPassword)) return setErrors({ newPassword: 'Must contain at least one number.' })
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) return setErrors({ newPassword: 'Must contain at least one special character.' })
    if (newPassword !== confirmPassword) return setErrors({ confirmPassword: 'Passwords do not match.' })
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { tempToken, newPassword })
      setStep('done')
      setErrors({})
    } catch (err) {
      setErrors({ form: err.response?.data?.message || 'Failed to reset password.' })
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at 50% 30%, rgba(212,175,55,0.05) 0%, transparent 60%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔐</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: 'var(--accent)', margin: '0 0 4px' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>We'll send a verification code to your phone</p>
        </div>

        {/* Progress dots */}
        {step !== 'done' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
            {['Enter Phone', 'Verify OTP', 'New Password'].map((label, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i < stepIndex ? 'var(--accent)' : i === stepIndex ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${i <= stepIndex ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                  color: i < stepIndex ? 'var(--primary)' : i === stepIndex ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'var(--transition)',
                }}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '10px', color: i === stepIndex ? 'var(--accent)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: '32px' }}>
          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.form key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label">Registered Mobile Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '15px', color: 'var(--text-muted)', flexShrink: 0 }}>🇮🇳 +91</div>
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" className={`input ${errors.phone ? 'error' : ''}`} maxLength={10} autoFocus />
                  </div>
                  {errors.phone && <p className="error-text">{errors.phone}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {loading ? 'Sending OTP...' : <>Send OTP <ArrowRight size={16} /></>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  OTP sent to <strong style={{ color: 'var(--text-primary)' }}>+91 {phone}</strong>
                </p>
                <div>
                  <label className="label">Enter 6-digit OTP</label>
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="• • • • • •" className={`input ${errors.otp ? 'error' : ''}`} style={{ letterSpacing: '0.5em', fontSize: '24px', textAlign: 'center' }} maxLength={6} autoFocus />
                  {errors.otp && <p className="error-text">{errors.otp}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type="button" onClick={() => setStep('phone')} className="btn btn-ghost" style={{ width: '100%', fontSize: '13px' }}>
                  <ArrowLeft size={14} /> Change Number
                </button>
              </motion.form>
            )}

            {step === 'newPassword' && (
              <motion.form key="newPassword" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {errors.form && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#ef4444' }}>{errors.form}</div>
                )}
                <div>
                  <label className="label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" className={`input ${errors.newPassword ? 'error' : ''}`} style={{ paddingRight: '44px' }} autoFocus />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="error-text">{errors.newPassword}</p>}
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Repeat your password" className={`input ${errors.confirmPassword ? 'error' : ''}`} />
                  {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </motion.form>
            )}

            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={60} style={{ color: '#22c55e', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Password Reset!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Your password has been updated successfully. Please log in with your new password.</p>
                <Link to="/login" className="btn btn-primary btn-lg" style={{ display: 'inline-flex' }}>
                  Go to Login <ArrowRight size={16} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 'phone' && (
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
