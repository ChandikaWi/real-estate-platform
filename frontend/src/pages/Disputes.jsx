import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useUI } from '../context/UIContext';

const Disputes = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert, showConfirm } = useUI();

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'reports') {
        const { data } = await api.get('/reports');
        setReports(data);
      } else if (tab === 'orders') {
        const { data } = await api.get('/admin/orders');
        setOrders(data);
      } else if (tab === 'reviews') {
        const { data } = await api.get('/admin/reviews');
        setReviews(data);
      }
    } catch (error) {
      console.error(error);
      showAlert('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id, status) => {
    try {
      await api.put(`/reports/${id}/status`, { status });
      setReports(reports.map(r => r._id === id ? { ...r, status } : r));
      showAlert(`Report marked as ${status}`, 'success');
    } catch (err) { 
      showAlert('Action failed', 'error'); 
    }
  };

  const requestForceCancel = (id) => {
    showConfirm('Are you sure you want to FORCE CANCEL this transaction? This will instantly revert the property to Active status.', () => {
      executeForceCancel(id);
    });
  };

  const executeForceCancel = async (id) => {
    try {
      await api.put(`/admin/orders/${id}/force-cancel`);
      setOrders(orders.map(o => o._id === id ? { ...o, status: 'Cancelled' } : o));
      showAlert('Order Force Cancelled successfully.', 'success');
    } catch (err) { 
      showAlert(err.response?.data?.message || 'Failed to cancel order', 'error'); 
    }
  };

  const requestWipeReview = (id) => {
    showConfirm('Are you sure you want to WIPE this review from the system? This action cannot be undone.', () => {
      executeWipeReview(id);
    });
  };

  const executeWipeReview = async (id) => {
    try {
      await api.delete(`/admin/reviews/${id}`);
      setReviews(reviews.filter(r => r._id !== id));
      showAlert('Review Wiped successfully.', 'success');
    } catch (err) { 
      showAlert('Failed to wipe review', 'error'); 
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>Dispute & Resolution Center</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>Resolve conflicts and maintain platform integrity.</p>
      
      {/* Resolution Health Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Pending Reports</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{reports.filter(r => r.status === 'Pending').length}</h3>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--primary-color)' }}>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Orders</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{orders.length}</h3>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid var(--danger-color)' }}>
          <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Reviews</p>
          <h3 style={{ margin: 0, fontSize: '1.8rem' }}>{reviews.length}</h3>
        </div>
      </div>
      
      {/* TABS & SEARCH */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
          {['reports', 'orders', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                backgroundColor: activeTab === tab ? 'var(--primary-color)' : 'var(--bg-card)',
                color: activeTab === tab ? '#fff' : 'var(--text-main)',
                border: `1px solid ${activeTab === tab ? 'var(--primary-color)' : 'var(--border-color)'}`,
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'reports' ? 'Flagged Reports' : tab === 'orders' ? 'Force Cancel Orders' : 'Wipe Reviews'}
            </button>
          ))}
        </div>
        <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="Search by ID, name, or details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {activeTab === 'reports' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Reporter</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Target</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Reason</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredReports = reports.filter(r => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (r.reporterId?.name || '').toLowerCase().includes(searchLower) ||
                      (r.targetId?.title || r.targetId?.name || '').toLowerCase().includes(searchLower) ||
                      (r.reason || '').toLowerCase().includes(searchLower)
                    );
                  });
                  return filteredReports.map(r => {
                    const isPending = r.status === 'Pending';
                    return (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isPending ? 'rgba(245, 158, 11, 0.05)' : 'transparent', borderLeft: isPending ? '4px solid #f59e0b' : '4px solid transparent', transition: 'background 0.2s' }}>
                      <td style={{ padding: '15px', color: 'var(--text-main)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px', color: 'var(--text-main)' }}>{r.reporterId?.name || 'Unknown'}</td>
                      <td style={{ padding: '15px', color: 'var(--text-main)' }}>
                        <div><strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.targetType}</strong></div>
                        <div>{r.targetId?.title || r.targetId?.name || r.targetId || 'Deleted Entity'}</div>
                      </td>
                      <td style={{ padding: '15px', color: 'var(--text-main)', maxWidth: '250px' }}>
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--border-color)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                          "{r.reason}"
                        </div>
                      </td>
                      <td style={{ padding: '15px', color: isPending ? '#f59e0b' : 'var(--text-muted)', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isPending && <span>⚠️</span>}
                          {r.status}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {r.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => updateReportStatus(r._id, 'Resolved')} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(16, 185, 129, 0.3)' }}>✅ Resolve</button>
                            <button onClick={() => updateReportStatus(r._id, 'Dismissed')} style={{ padding: '6px 12px', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', border: '2px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>Dismiss</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )});
                })()}
                {reports.filter(r => (r.reporterId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.targetId?.title || r.targetId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No flagged reports found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'orders' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Property</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Buyer & Seller</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredOrders = orders.filter(o => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (o.propertyId?.title || '').toLowerCase().includes(searchLower) ||
                      (o.buyerId?.name || '').toLowerCase().includes(searchLower) ||
                      (o.sellerId?.name || '').toLowerCase().includes(searchLower)
                    );
                  });
                  return filteredOrders.map(o => (
                    <tr key={o._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '15px', color: 'var(--text-main)', maxWidth: '200px' }}>{o.propertyId?.title || 'Unknown Property'}</td>
                      <td style={{ padding: '15px', color: 'var(--text-main)' }}>
                        <div style={{ fontSize: '0.9rem' }}>B: {o.buyerId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.9rem' }}>S: {o.sellerId?.name || 'Unknown'}</div>
                      </td>
                      <td style={{ padding: '15px', color: 'var(--text-main)', fontWeight: 'bold' }}>Rs. {((o.status === 'Completed' && o.finalSoldPrice) ? o.finalSoldPrice : (o.amount || 0)).toLocaleString()}</td>
                      <td style={{ padding: '15px', color: o.status === 'Cancelled' ? 'var(--danger-color)' : o.status === 'Completed' ? 'var(--success-color)' : 'var(--accent-color)', fontWeight: 'bold' }}>{o.status}</td>
                      <td style={{ padding: '15px' }}>
                        {['Pending', 'Approved'].includes(o.status) && (
                          <button onClick={() => requestForceCancel(o._id)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}>🛑 Force Cancel</button>
                        )}
                        {o.status === 'Completed' && <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: '500', backgroundColor: 'var(--bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>Non-cancellable</span>}
                      </td>
                    </tr>
                  ));
                })()}
                {orders.filter(o => (o.propertyId?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.buyerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (o.sellerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'reviews' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Reviewer & Target</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Rating</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Comment</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)', fontWeight: '600' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredReviews = reviews.filter(r => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                      (r.buyerId?.name || '').toLowerCase().includes(searchLower) ||
                      (r.sellerId?.name || '').toLowerCase().includes(searchLower) ||
                      (r.comment || '').toLowerCase().includes(searchLower)
                    );
                  });
                  return filteredReviews.map(r => {
                    let starColor = '#10b981'; // Green for 4-5
                    if (r.rating <= 2) starColor = '#ef4444'; // Red for 1-2
                    else if (r.rating === 3) starColor = '#f59e0b'; // Yellow for 3
                    
                    return (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '15px', color: 'var(--text-main)' }}>
                        <div style={{ fontSize: '0.9rem' }}>By: {r.buyerId?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>For: {r.sellerId?.name || 'Unknown'}</div>
                      </td>
                      <td style={{ padding: '15px', fontSize: '1.2rem', color: starColor }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                      <td style={{ padding: '15px', color: 'var(--text-main)', maxWidth: '300px' }}>
                        <div style={{ backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--border-color)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                          "{r.comment}"
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <button onClick={() => requestWipeReview(r._id)} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#dc2626'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ef4444'}>🗑️ Wipe Review</button>
                      </td>
                    </tr>
                  )});
                })()}
                {reviews.filter(r => (r.buyerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.sellerId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No reviews found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
};

export default Disputes;
