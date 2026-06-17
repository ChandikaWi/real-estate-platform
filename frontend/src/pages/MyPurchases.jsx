import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const MyPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try { const { data } = await api.get('/orders/buyer'); setOrders(data); setLoading(false); } 
      catch (err) { setLoading(false); }
    };
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Cancel this order?')) {
      try {
        const { data } = await api.put(`/orders/${orderId}/status`, { action: 'cancel' });
        setOrders(orders.map(order => order._id === orderId ? data : order));
      } catch (error) { alert(error.response?.data?.message || 'Failed to cancel order'); }
    }
  };

  const isWithinThreeDays = (dateString) => {
    const diffTime = Math.abs(new Date() - new Date(dateString));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 3;
  };

  if (loading) return <h2 style={{ color: 'var(--text-main)' }}>Loading purchases...</h2>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <h1 style={{ margin: '0 0 20px 0' }}>My Purchases</h1>
      {orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>You haven't purchased any properties yet.</p>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Order ID</th>
                <th style={{ padding: '15px' }}>Property</th>
                <th style={{ padding: '15px' }}>Amount Paid</th>
                <th style={{ padding: '15px' }}>Date</th>
                <th style={{ padding: '15px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isPending = order.status === 'Pending';
                const isCancelled = order.status === 'Cancelled';
                return (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '15px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order._id}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{order.propertyId?.title || 'Property Unavailable'}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--accent-color)' }}>Rs. {order.amount.toLocaleString()}</td>
                    <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          backgroundColor: isPending ? '#f39c12' : isCancelled ? 'var(--danger-color)' : 'var(--accent-color)', 
                          color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' 
                        }}>
                          {order.status}
                        </span>
                        {isPending && isWithinThreeDays(order.createdAt) && (
                          <button onClick={() => handleCancelOrder(order._id)} style={{ padding: '4px 8px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            Cancel
                          </button>
                        )}
                      </div>
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

export default MyPurchases;