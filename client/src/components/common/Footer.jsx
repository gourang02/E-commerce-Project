import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--primary)', borderTop: '1px solid var(--border)', marginTop: '80px' }}>
      {/* Main Footer */}
      <div className="page-container" style={{ padding: '60px 16px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '28px' }}>🕶️</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>Raunak Opticals</div>
              <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: 'var(--text-muted)' }}>SEE THE WORLD CLEARLY</div>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '240px' }}>
            Premium eyewear for every style and prescription. Quality frames, expert lens fitting, and unbeatable prices.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {[
              { icon: <FaInstagram size={16} />, href: '#' },
              { icon: <FaFacebook size={16} />, href: '#' },
              { icon: <FaTwitter size={16} />, href: '#' },
              { icon: <FaYoutube size={16} />, href: '#' },
            ].map((s, i) => (
              <a key={i} href={s.href} style={{
                width: 36, height: 36, borderRadius: '8px', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >{s.icon}</a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Shop</h4>
          {['Eyeglasses', 'Sunglasses', 'Contact Lenses', 'Computer Glasses', 'Reading Glasses', 'Accessories'].map((item) => (
            <Link key={item} to={`/products?category=${item.toLowerCase().replace(' ', '-')}`}
              style={{ display: 'block', padding: '5px 0', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >{item}</Link>
          ))}
        </div>

        {/* Help */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Help</h4>
          {['My Orders', 'Return & Exchange', 'Frame Size Guide', 'Prescription Guide', 'Contact Us', 'Privacy Policy', 'Terms of Service'].map((item) => (
            <Link key={item} to={`/${item.toLowerCase().replace(/ & | /g, '-')}`}
              style={{ display: 'block', padding: '5px 0', fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'var(--transition)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
            >{item}</Link>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Contact</h4>
          {[
            { icon: <Phone size={14} />, text: '+91 98765 43210' },
            { icon: <Mail size={14} />, text: 'support@raunakopticals.com' },
            { icon: <MapPin size={14} />, text: 'Shop No. 12, Main Market\nYour City, State 110001' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
              <span style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}

          {/* Newsletter */}
          <div style={{ marginTop: '20px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Get exclusive deals in your inbox</h5>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="your@email.com" className="input" style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }} />
              <button className="btn btn-primary btn-sm" style={{ padding: '8px 14px', fontSize: '12px' }}>Subscribe</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 16px' }}>
        <div className="page-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            © {new Date().getFullYear()} Raunak Opticals. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {['Secure Payments', 'ISO Certified', '10k+ Happy Customers', 'Free Returns'].map((badge) => (
              <span key={badge} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'var(--accent)' }}>✓</span> {badge}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Visa', 'Mastercard', 'UPI', 'Razorpay', 'COD'].map((pay) => (
              <span key={pay} style={{
                padding: '3px 10px', borderRadius: '4px',
                border: '1px solid var(--border)', fontSize: '11px',
                color: 'var(--text-muted)', fontWeight: 500,
              }}>{pay}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
