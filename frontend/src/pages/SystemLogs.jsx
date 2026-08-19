import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = [
    { id: 'all', label: 'All Logs' },
    { id: 'auth', label: 'Authentication' },
    { id: 'moderation', label: 'Moderation' },
    { id: 'transaction', label: 'Transactions' },
    { id: 'system', label: 'System & AI' },
  ];

  useEffect(() => {
    fetchLogs(activeTab);
  }, [activeTab]);

  const fetchLogs = async (type) => {
    try {
      setLoading(true);
      const url = type === 'all' ? '/logs' : `/logs?type=${type}`;
      const { data } = await api.get(url);
      setLogs(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system logs.');
      setLoading(false);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'auth': return '🔐';
      case 'moderation': return '🛡️';
      case 'transaction': return '💳';
      case 'system': return '⚙️';
      default: return '📄';
    }
  };

  const getActionColor = (action) => {
    if (action.includes('error') || action.includes('cancel') || action.includes('delete') || action.includes('block') || action.includes('ban')) {
      return 'var(--danger-color)';
    }
    if (action.includes('create') || action.includes('register') || action.includes('approve') || action.includes('complete')) {
      return 'var(--success-color)';
    }
    return 'var(--primary-color)';
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0 0 5px 0' }}>Watchtower</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Master Audit Trail & System Logs</p>
        </div>
        <button 
          onClick={() => fetchLogs(activeTab)}
          style={{ padding: '10px 20px', background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Refresh Logs
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search logs by action, details, or user..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: activeTab === tab.id ? 'var(--primary-color)' : 'var(--bg-card)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-main)',
              border: `1px solid ${activeTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ERROR / LOADING */}
      {error && (
        <div style={{ padding: '15px 20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>⚠️ {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>&times;</button>
        </div>
      )}
      
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : (
        /* LOGS TABLE */
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Type</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Action</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Performed By</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Details</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem' }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredLogs = logs.filter(log => {
                    if (!searchTerm) return true;
                    const searchLower = searchTerm.toLowerCase();
                    const actionMatch = log.action.toLowerCase().includes(searchLower);
                    const detailsMatch = JSON.stringify(log.details || {}).toLowerCase().includes(searchLower);
                    const performerMatch = log.performedBy && (
                      (log.performedBy.name && log.performedBy.name.toLowerCase().includes(searchLower)) ||
                      (log.performedBy.email && log.performedBy.email.toLowerCase().includes(searchLower)) ||
                      (log.performedBy._id && log.performedBy._id.toString().toLowerCase().includes(searchLower))
                    );
                    return actionMatch || detailsMatch || performerMatch;
                  });

                  if (filteredLogs.length === 0) {
                    return (
                      <tr>
                        <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs found matching your criteria.</td>
                      </tr>
                    );
                  }

                  return filteredLogs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '15px', color: 'var(--text-main)', fontSize: '1.2rem' }} title={log.type}>
                        {getLogIcon(log.type)}
                      </td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: getActionColor(log.action), textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                        {log.action.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '15px' }}>
                        {log.performedBy ? (
                          <div>
                            <div style={{ color: 'var(--text-main)', fontWeight: '600', fontSize: '0.95rem' }}>{log.performedBy.name || log.performedBy.email || 'Admin'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>{log.performedBy.role || 'Admin'}</div>
                            {/* Tracking account ID */}
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', fontFamily: 'monospace' }}>ID: {log.performedBy._id}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>System Automatically</span>
                        )}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                          {log.details && Object.keys(log.details).length > 0 ? (
                            Object.entries(log.details).map(([key, value]) => (
                              <div key={key} style={{ marginBottom: '4px' }}>
                                <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}: </strong>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No additional details</span>
                          )}
                        </div>
                        {log.targetId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'monospace' }}>Target ID: {log.targetId}</div>}
                      </td>
                      <td style={{ padding: '15px', color: 'var(--text-main)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SystemLogs;
