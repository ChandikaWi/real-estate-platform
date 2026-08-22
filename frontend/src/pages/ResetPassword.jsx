import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, color: 'var(--bg-hover)', text: '' };
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score < 2) return { score: 25, color: '#ef4444', text: 'Weak' };
    if (score < 4) return { score: 60, color: '#f59e0b', text: 'Good' };
    return { score: 100, color: '#10b981', text: 'Strong' };
  };
  const strength = calculateStrength(password);

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ maxWidth: '450px', width: '100%', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
        
        <h2 style={{ fontSize: '1.8rem', margin: '0 0 10px 0', color: 'var(--text-main)' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.5' }}>Create a new, strong password for your account.</p>

        {message && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--accent-color)', padding: '15px', borderRadius: '4px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ color: 'var(--accent-color)', margin: 0, fontWeight: 'bold' }}>{message}</p>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--danger-color)', padding: '15px', borderRadius: '4px', marginBottom: '20px', textAlign: 'left' }}>
            <p style={{ color: 'var(--danger-color)', margin: 0, fontWeight: 'bold' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600' }}>New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.2)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
            
            {/* Strength Meter */}
            <div style={{ marginTop: '10px', height: '6px', width: '100%', backgroundColor: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ height: '100%', width: `${strength.score}%`, backgroundColor: strength.color, transition: 'all 0.3s' }}></div>
            </div>
            {strength.text && <div style={{ fontSize: '0.8rem', color: strength.color, textAlign: 'right', marginTop: '4px', fontWeight: 'bold' }}>{strength.text}</div>}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: '600' }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength="6" style={{ width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s' }} onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.2)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }} />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer', fontWeight: '800', fontSize: '1.1rem' }}>
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;