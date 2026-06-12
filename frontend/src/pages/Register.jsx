import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'buyer' });
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
      setError(err.response?.data?.message || 'Failed to register');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--text-main)' }}>Create Account</h2>
      {error && <p style={{ color: 'var(--danger-color)', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '6px' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: '600' }}>Full Name</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: '600' }}>Email Address</label>
          <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: '600' }}>Password</label>
          <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-main)', fontWeight: '600' }}>I am a...</label>
          <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '12px', boxSizing: 'border-box', borderRadius: '6px' }}>
            <option value="buyer">Buyer (Looking for properties)</option>
            <option value="seller">Seller (Listing properties)</option>
          </select>
        </div>
        <button type="submit" disabled={loading} style={{ padding: '12px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' }}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;