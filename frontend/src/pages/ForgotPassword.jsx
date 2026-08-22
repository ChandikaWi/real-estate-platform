import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'If an account with that email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ maxWidth: '450px', width: '100%', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
        
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔐</div>
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0', color: 'var(--text-main)' }}>Forgot Password?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.5' }}>
          Enter the email address associated with your account and we will send you a link to reset your password.
        </p>

        {message && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--accent-color)', padding: '15px', borderRadius: '4px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ color: 'var(--accent-color)', margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{message}</p>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', padding: '15px', borderRadius: '4px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ color: 'var(--danger-color)', margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your registered email"
              required 
              style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }} 
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s' }}
            onMouseOver={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={{ marginTop: '25px' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.95rem' }}>&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;