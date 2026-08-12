import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {/* Main Split-Screen Container */}
      <div style={{ 
        display: 'flex', 
        maxWidth: '1000px', 
        width: '100%', 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '24px', 
        boxShadow: 'var(--shadow-lg)', 
        border: '1px solid var(--border-color)', 
        overflow: 'hidden',
        flexWrap: 'wrap' // Allows stacking on mobile screens
      }}>
        
        {/* Left Side - Branding & Value Proposition */}
        <div style={{ 
          flex: '1 1 400px', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%), url("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          padding: '60px 40px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          color: '#fff',
          minHeight: '400px'
        }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0 0 20px 0', lineHeight: 1.1, fontWeight: '800' }}>
            Join the Elite Real Estate Network.
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '400px' }}>
            Whether you are finding your dream home with AI or selling to a premium audience, your journey starts right here.
          </p>
        </div>

        {/* Right Side - The Form */}
        <div style={{ 
          flex: '1 1 400px', 
          padding: '50px 40px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-card)' 
        }}>
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: 'var(--text-main)' }}>Create Account</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Join us and experience real estate like never before.</p>
            </div>
            
            {/* Enhanced Error UI */}
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', padding: '12px 15px', borderRadius: '4px', marginBottom: '20px' }}>
                <p style={{ color: 'var(--danger-color)', margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Role Selection Cards */}
              <div style={{ marginBottom: '5px' }}>
                <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>I am looking to...</label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div 
                    onClick={() => setFormData({...formData, role: 'buyer'})}
                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', border: `2px solid ${formData.role === 'buyer' ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: formData.role === 'buyer' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-main)', transition: 'all 0.2s ease' }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🔑</div>
                    <div style={{ fontWeight: 'bold', color: formData.role === 'buyer' ? 'var(--primary-color)' : 'var(--text-main)', fontSize: '0.9rem' }}>Buy / Rent</div>
                  </div>
                  <div 
                    onClick={() => setFormData({...formData, role: 'seller'})}
                    style={{ flex: 1, padding: '12px', textAlign: 'center', borderRadius: '12px', cursor: 'pointer', border: `2px solid ${formData.role === 'seller' ? 'var(--accent-color)' : 'var(--border-color)'}`, backgroundColor: formData.role === 'seller' ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-main)', transition: 'all 0.2s ease' }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>🏢</div>
                    <div style={{ fontWeight: 'bold', color: formData.role === 'seller' ? 'var(--accent-color)' : 'var(--text-main)', fontSize: '0.9rem' }}>Sell / List</div>
                  </div>
                </div>
              </div>

              {/* Full Name Input */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="John Doe"
                  required 
                  style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} 
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              {/* Email Input */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  placeholder="name@example.com"
                  required 
                  style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} 
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              {/* Password Input with Toggle */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Create a strong password"
                    required 
                    minLength="6"
                    style={{ width: '100%', padding: '12px 14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} 
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.1rem', marginTop: '10px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s ease' }}
                onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div style={{ marginTop: '25px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>Sign in instead</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;