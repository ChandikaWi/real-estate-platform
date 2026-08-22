import React, { useState, useEffect } from 'react';

const PrivacyPolicy = () => {
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
      <div style={{ width: '250px', flexShrink: 0, display: 'none' }} className="privacy-sidebar">
        <div style={{ position: 'sticky', top: '100px', backgroundColor: 'var(--bg-card)', padding: '25px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', color: 'var(--text-main)' }}>Contents</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'section-1', title: '1. Information We Collect' },
              { id: 'section-2', title: '2. How We Use Data' },
              { id: 'section-3', title: '3. Data Sharing' },
              { id: 'section-4', title: '4. AI & Machine Learning' },
              { id: 'section-5', title: '5. Contact Us' }
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '20px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
            Last Updated: August 2026
          </div>
          <h1 style={{ fontSize: '3rem', margin: '0 0 15px 0', letterSpacing: '-1px' }}>Privacy Policy</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Your privacy is critically important to us. We believe in total transparency when it comes to how we handle your data.
          </p>
        </div>

        {/* TL,DR CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '50px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>No Data Selling</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>We will never sell your personal contact information to third-party advertisers.</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>Bank-Level Security</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>All your communications and payment details are secured with AES-256 encryption.</p>
          </div>
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </div>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0' }}>Safe AI Models</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Our AI models use aggregated, anonymized data. Your identity is strictly protected.</p>
          </div>
        </div>

        {/* POLICY CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <section id="section-1">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>1. Information We Collect</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: '0 0 15px 0' }}>
              We collect information that you provide directly to us when you register for an account, 
              update your profile, save properties, or communicate with other users (buyers/sellers) 
              through our platform.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              This may include your name, email address, phone number, physical address, financial preferences, and any 
              other information you choose to provide in your public or private profile.
            </p>
          </section>

          <section id="section-2">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>2. How We Use Your Information</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', marginBottom: '20px' }}>We use the information we collect to operate, maintain, and provide the features of our platform:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                "Provide, maintain, and improve our real estate platform.",
                "Power our AI Valuation and Lifestyle Matching engines to give you personalized recommendations.",
                "Facilitate secure communication between verified buyers and sellers.",
                "Send you technical notices, updates, security alerts, and administrative messages."
              ].map((text, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '1.05rem' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </section>

          <section id="section-3">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>3. Data Sharing and Security</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', padding: '20px', borderRadius: '0 12px 12px 0', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: 'bold', margin: '0 0 8px 0' }}>Our Commitment</p>
              <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: '1.6' }}>We do not sell, rent, or trade your personal data to third parties for commercial purposes.</p>
            </div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              Your contact information is only shared with verified sellers when you explicitly express interest in a property or schedule a visit. 
              We use industry-standard encryption protocols (SSL/TLS) to protect your account details and communications both in transit and at rest.
            </p>
          </section>

          <section id="section-4">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>4. AI and Machine Learning</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              Our platform utilizes advanced Machine Learning models (such as XGBoost) to predict property valuations and match 
              lifestyles. These models analyze anonymized, aggregated platform data. Your specific personal 
              identity and private communications are <strong>never</strong> fed directly into these training models without your explicit consent.
            </p>
          </section>

          <section id="section-5">
            <h2 style={{ fontSize: '1.75rem', marginBottom: '15px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>5. Contact Us</h2>
            <div style={{ height: '3px', width: '40px', backgroundColor: 'var(--primary-color)', marginBottom: '20px', borderRadius: '2px' }}></div>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.05rem', margin: 0 }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our dedicated Privacy Team at <a href="mailto:privacy@realestate.lk" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>privacy@realestate.lk</a>.
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
          .privacy-sidebar { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicy;
