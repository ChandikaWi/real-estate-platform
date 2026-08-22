import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // UX Features
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('userInfo', JSON.stringify(data));
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Route all users to the Home page regardless of their role
      navigate('/');
      
      window.location.reload(); // To update Navbar state
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
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
        flexWrap: 'wrap' // Allows stacking on mobile
      }}>
        
        {/* Left Side - Branding & Value Proposition */}
        <div style={{ 
          flex: '1 1 400px', 
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.85) 0%, rgba(16, 185, 129, 0.85) 100%), url("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")', 
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
            Welcome to the Future of Real Estate.
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6, maxWidth: '400px' }}>
            Sign in to access AI-powered valuations, personalized lifestyle matches, and premium listings across Sri Lanka.
          </p>
        </div>

        {/* Right Side - The Form */}
        <div style={{ 
          flex: '1 1 400px', 
          padding: '60px 40px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          backgroundColor: 'var(--bg-card)' 
        }}>
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: 'var(--text-main)' }}>Welcome Back</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1rem' }}>Please enter your details to sign in.</p>
            </div>
            
            {/* Error UI */}
            {error && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', padding: '15px', borderRadius: '4px', marginBottom: '25px' }}>
                <p style={{ color: 'var(--danger-color)', margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Email Input */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Enter your email"
                  required 
                  autoFocus
                  style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} 
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              
              {/* Password Input with Toggle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>Password</label>
                  <Link to="/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '600' }}>Forgot Password?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onKeyUp={(e) => {
                      if (e.getModifierState('CapsLock')) {
                        setCapsLockOn(true);
                      } else {
                        setCapsLockOn(false);
                      }
                    }}
                    placeholder="••••••••"
                    required 
                    style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s ease' }} 
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                  {/* Eye Icon Toggle */}
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
                {/* Caps Lock Warning */}
                {capsLockOn && (
                  <div style={{ marginTop: '8px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ⚠️ Caps Lock is ON
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }}
                />
                <label htmlFor="rememberMe" style={{ color: 'var(--text-main)', fontSize: '0.95rem', cursor: 'pointer', userSelect: 'none' }}>
                  Remember my email
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading} 
                style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.1rem', marginTop: '10px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s ease' }}
                onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}>Sign up for free</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;