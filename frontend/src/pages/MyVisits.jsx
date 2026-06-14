import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const MyVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const { data } = await api.get('/visits/buyer');
        setVisits(data);
      } catch (err) { console.error("Failed to load visits"); }
      finally { setLoading(false); }
    };
    fetchVisits();
  }, []);

  const handleCancelVisit = async (id) => {
    if (window.confirm('Are you sure you want to cancel this visit request?')) {
      try {
        await api.delete(`/visits/${id}`);
        setVisits(visits.filter(v => v._id !== id));
      } catch (err) { alert('Failed to cancel visit'); }
    }
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading schedule...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 20px 0' }}>My Scheduled Visits</h1>
      
      {visits.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You have no property viewings scheduled.</p>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '15px' }}>Property</th>
                <th style={{ padding: '15px' }}>Date & Time</th>
                <th style={{ padding: '15px' }}>Seller Contact</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(visit => {
                const isPending = visit.status === 'Pending';
                const isAccepted = visit.status === 'Accepted';
                return (
                  <tr key={visit._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{visit.propertyId?.title || 'Property Unavailable'}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{new Date(visit.date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{visit.timeSlot}</div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      {visit.sellerId?.name}<br/>
                      {isAccepted ? <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📞 {visit.sellerId?.phoneNumber || 'N/A'}</span> : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Available upon approval)</span>}
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        backgroundColor: isPending ? 'rgba(243, 156, 18, 0.1)' : isAccepted ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', 
                        color: isPending ? '#f39c12' : isAccepted ? 'var(--accent-color)' : 'var(--danger-color)', 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' 
                      }}>
                        {visit.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <button onClick={() => handleCancelVisit(visit._id)} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        Cancel Request
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyVisits;