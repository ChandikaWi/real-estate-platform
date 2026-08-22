import React, { useState, useEffect } from 'react';

const TermsConditions = () => {
  const [activeSection, setActiveSection] = useState('section-1');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['section-1', 'section-2', 'section-3', 'section-4', 'section-5'];
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 300) {
            setActiveSection(id);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 20px', color: 'var(--text-main)', minHeight: '85vh', display: 'flex', gap: '40px' }}>
      
      {/* STICKY SIDEBAR (Table of Contents) */}
      <div style={{ width: '250px', flexShrink: 0, display: 'none' }} className="terms-sidebar">
        <div style={{ position: 'sticky', top: '100px', backgroundColor: 'var(--bg-card)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', color: 'var(--text-main)' }}>Contents</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'section-1', title: '1. Acceptance of Terms' },
              { id: 'section-2', title: '2. User Accounts' },
              { id: 'section-3', title: '3. Property Listings' },
              { id: 'section-4', title: '4. Transactions & Disputes' },
              { id: 'section-5', title: '5. Limitation of Liability' }
            ].map((item) => (
              <li key={item.id}>
                <button 
                  onClick={() => scrollToSection(item.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: activeSection === item.id ? 'var(--primary-color)' : 'var(--text-muted)', 
                    fontWeight: activeSection === item.id ? 'bold' : 'normal',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                    fontSize: '0.95rem',
                    transition: 'color 0.2s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {activeSection === item.id && (
                    <span style={{ position: 'absolute', left: '-15px', color: 'var(--primary-color)' }}>•</span>
                  )}
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, maxWidth: '800px' }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '50px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '20px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
            Last Updated: August 2026
          </div>
          <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0', letterSpacing: '-1px' }}>Terms & Conditions</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Welcome to RealEstate Marketplace. Please read these terms carefully before using our services.
          </p>
        </div>

        {/* TL,DR CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>Fair Use</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Use the platform responsibly. Fraudulent activity results in immediate bans.</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"></path><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>Accurate Listings</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Sellers are fully responsible for providing truthful property information.</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>Secure Transactions</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>While we connect parties securely, actual transfers are handled off-platform.</p>
          </div>
        </div>

        {/* POLICY CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <section id="section-1">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>1. Acceptance of Terms</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: '0 0 15px 0' }}>
              By accessing or using the RealEstate Marketplace, you agree to be bound by these Terms & Conditions. 
              If you do not agree to all the terms and conditions, then you may not access the platform or use any services.
            </p>
          </section>

          <section id="section-2">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>2. User Accounts</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                "You are responsible for maintaining the confidentiality of your account credentials.",
                "You are fully responsible for all activities that occur under your account.",
                "You agree to immediately notify us of any unauthorized use or security breaches."
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section id="section-3">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>3. Property Listings</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444', padding: '20px', borderRadius: '0 12px 12px 0', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: 'bold', margin: '0 0 8px 0' }}>Seller Responsibility</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: '1.6' }}>Sellers are solely responsible for the accuracy and legality of their property listings.</p>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              We reserve the right to remove or reject any listing that violates our guidelines, contains fraudulent information, or is deemed 
              inappropriate by our administration team without prior notice.
            </p>
          </section>

          <section id="section-4">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>4. Transactions and Disputes</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: '0 0 15px 0' }}>
              While we facilitate connections between buyers and sellers, we are <strong>not a party</strong> to the actual transaction 
              or legal transfer of property. 
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              Any disputes arising from transactions must be handled directly between the involved parties or through our official platform dispute resolution center.
            </p>
          </section>

          <section id="section-5">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>5. Limitation of Liability</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              In no event shall RealEstate Marketplace, nor its directors, employees, partners, agents, suppliers, 
              or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting 
              from your access to or use of or inability to access or use the platform.
            </p>
          </section>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @media (min-width: 900px) {
          .terms-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default TermsConditions;
