import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'seller') {
      navigate('/login');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/properties/seller/analytics');
        setAnalytics(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load performance data.');
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [navigate]);

  if (loading) return <h2>Loading Performance Analytics...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '5px' }}>Performance Analytics</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Track how your listings are performing across the marketplace.</p>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #3498db', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Views</h4>
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{analytics.summary.totalViews}</h2>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #9b59b6', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Inquiries</h4>
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{analytics.summary.totalInquiries}</h2>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #f39c12', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Active Listings</h4>
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{analytics.summary.activeListings}</h2>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '5px solid #2ecc71', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d' }}>Total Revenue</h4>
          <h2 style={{ margin: 0, fontSize: '2rem', color: '#27ae60' }}>${analytics.summary.totalSalesRevenue.toLocaleString()}</h2>
        </div>
      </div>

      {/* Granular Performance Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', backgroundColor: '#fdfefe', borderBottom: '1px solid #eee' }}>
          <h3 style={{ margin: 0 }}>Listing Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f4f4f9', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '15px' }}>Property Title</th>
                <th style={{ padding: '15px' }}>Status</th>
                <th style={{ padding: '15px' }}>Page Views</th>
                <th style={{ padding: '15px' }}>Chat Inquiries</th>
                <th style={{ padding: '15px' }}>Orders</th>
                <th style={{ padding: '15px' }}>Revenue Generated</th>
                <th style={{ padding: '15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics.listings.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>No listings available to track.</td>
                </tr>
              ) : (
                analytics.listings.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{item.title}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ backgroundColor: item.status === 'Sold' ? '#e8f8f5' : '#eaf2f8', color: item.status === 'Sold' ? '#27ae60' : '#2980b9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px' }}>{item.views} <span style={{ color: '#aaa', fontSize: '0.8rem' }}>views</span></td>
                    <td style={{ padding: '15px' }}>{item.inquiries} <span style={{ color: '#aaa', fontSize: '0.8rem' }}>msgs</span></td>
                    <td style={{ padding: '15px' }}>{item.orders}</td>
                    <td style={{ padding: '15px', color: '#27ae60', fontWeight: 'bold' }}>${item.revenue.toLocaleString()}</td>
                    <td style={{ padding: '15px' }}>
                      <button onClick={() => navigate(`/property/${item._id}`)} style={{ padding: '6px 12px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;