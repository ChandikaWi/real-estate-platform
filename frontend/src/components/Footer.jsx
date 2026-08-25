import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: '60px 20px 20px 20px', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', paddingBottom: '40px', borderBottom: '1px solid var(--border-color)' }}>
        
        {/* Brand Section */}
        <div>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>L</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.5px', lineHeight: '1.2' }}>LakEstates</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Sri Lanka's Property Marketplace</span>
            </div>
          </Link>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Powered by AI. Verified by Experts. Discover Sri Lanka's most premium homes, apartments, and land seamlessly.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '20px' }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/login" className="footer-link">Sign In</Link></li>
            <li><Link to="/register" className="footer-link">Create Account</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '20px' }}>Legal</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
            <li><Link to="/terms" className="footer-link">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Contact & Socials */}
        <div>
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '20px' }}>Contact Us</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📧</span> support@realestate.lk
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📞</span> +94 77 234 5678
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📍</span> Gampaha, Sri Lanka
            </li>
          </ul>
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <a href="https://www.facebook.com/login/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="social-icon" title="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </div>
            </a>
            <a href="https://twitter.com/login" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="social-icon" title="X (Twitter)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="20" y2="20"></line><line x1="20" y1="4" x2="4" y2="20"></line></svg>
              </div>
            </a>
            <a href="https://www.instagram.com/accounts/login/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="social-icon" title="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
            </a>
          </div>
        </div>

      </div>
      
      {/* Copyright Bar */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} LakEstates - Sri Lanka's Property Marketplace. All rights reserved.
      </div>
      
      {/* Footer Specific CSS */}
      <style>{`
        .footer-link {
          position: relative;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.3s ease;
          display: inline-block;
          font-weight: 500;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -2px;
          left: 0;
          background-color: var(--primary-color);
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        .footer-link:hover {
          color: var(--primary-color);
        }
        .footer-link:hover::after {
          width: 100%;
        }
        
        .social-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--bg-hover);
          color: var(--text-main);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .social-icon:hover {
          background-color: var(--primary-color);
          color: #fff;
          transform: scale(1.15) translateY(-3px);
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
        }
      `}</style>
    </footer>
  );
};

export default Footer;
