import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const PlatformSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isSavingAI, setIsSavingAI] = useState(false);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/login');
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings');
        setLoading(false);
      }
    };
    fetchSettings();
  }, [navigate]);

  const handleUpdate = async (updatedFields) => {
    try {
      if (updatedFields.aiValuationThreshold !== undefined) setIsSavingAI(true);
      
      const { data } = await api.put('/settings', updatedFields);
      setSettings(data);
      
      if (updatedFields.aiValuationThreshold === undefined) {
        setSuccessMsg('Settings updated successfully.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setTimeout(() => setIsSavingAI(false), 2000);
      }
    } catch (err) {
      setIsSavingAI(false);
      setError(err.response?.data?.message || 'Failed to update settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) return <div style={{ maxWidth: '800px', margin: '100px auto', textAlign: 'center' }}><h2 style={{ color: 'var(--text-main)' }}>Loading Settings...</h2></div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 20px 60px 20px', color: 'var(--text-main)' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', 
        border: '1px solid rgba(243, 156, 18, 0.2)', 
        borderRadius: '24px', 
        padding: '40px', 
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2rem', fontWeight: '800' }}>Platform Settings (CMS)</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Dynamically configure platform behavior without deploying code.</p>
      </div>

      {successMsg && (
        <div style={{ padding: '15px 20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          ✅ {successMsg}
        </div>
      )}
      
      {error && (
        <div style={{ padding: '15px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🧠</span> AI Valuation Sensitivity
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.6' }}>
          Adjust the percentage threshold that determines if a property is flagged as "Overpriced" or "Underpriced" in the Market Audit. 
          A lower percentage makes the AI stricter.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <input 
            type="range" 
            min="5" 
            max="30" 
            step="1"
            value={settings?.aiValuationThreshold || 15}
            onChange={(e) => setSettings({ ...settings, aiValuationThreshold: Number(e.target.value) })}
            style={{ flex: 1, accentColor: 'var(--primary-color)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary-color)', minWidth: '60px' }}>
            ±{settings?.aiValuationThreshold}%
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px', marginBottom: '25px', fontWeight: 'bold' }}>
          <span>Strict (±5%)</span>
          <span>Loose (±30%)</span>
        </div>

        <button 
          onClick={() => handleUpdate({ aiValuationThreshold: settings.aiValuationThreshold })}
          style={{ padding: '12px 24px', backgroundColor: isSavingAI ? '#10b981' : 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.3s', transform: isSavingAI ? 'scale(0.95)' : 'scale(1)' }}
        >
          {isSavingAI ? '✅ Saved!' : 'Save AI Threshold'}
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '30px', borderRadius: '16px', border: `1px solid ${settings?.maintenanceMode ? 'var(--danger-color)' : 'var(--border-color)'}`, boxShadow: settings?.maintenanceMode ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'var(--shadow-sm)', transition: 'all 0.3s' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: settings?.maintenanceMode ? 'var(--danger-color)' : 'var(--text-main)' }}>
          <span style={{ animation: settings?.maintenanceMode ? 'pulse 2s infinite' : 'none' }}>{settings?.maintenanceMode ? '🚨' : '🚧'}</span> Maintenance Mode
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px', lineHeight: '1.6' }}>
          When enabled, non-admin users will be unable to log in, and sellers will be unable to create new property listings. A banner will also appear across the application.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: settings?.maintenanceMode ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: `1px solid ${settings?.maintenanceMode ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, transition: 'all 0.3s' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: settings?.maintenanceMode ? 'var(--danger-color)' : 'var(--text-main)' }}>
              {settings?.maintenanceMode ? 'Maintenance Mode is Active' : 'Maintenance Mode is Off'}
            </h3>
            <p style={{ margin: 0, color: settings?.maintenanceMode ? 'var(--danger-color)' : 'var(--text-muted)', fontSize: '0.9rem', opacity: 0.8 }}>
              {settings?.maintenanceMode ? '⚠️ The platform is currently locked down.' : 'The platform is operating normally.'}
            </p>
          </div>
          
          <div 
            onClick={() => handleUpdate({ maintenanceMode: !settings?.maintenanceMode })}
            style={{
              width: '60px',
              height: '32px',
              backgroundColor: settings?.maintenanceMode ? 'var(--danger-color)' : 'var(--border-color)',
              borderRadius: '30px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              display: 'flex',
              alignItems: 'center',
              padding: '0 4px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#fff',
              borderRadius: '50%',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              position: 'absolute',
              left: settings?.maintenanceMode ? '32px' : '4px',
              transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettings;
